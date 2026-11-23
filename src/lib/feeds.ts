import { XMLParser } from "fast-xml-parser";
import crypto from "node:crypto";
import { DOMAINS, NEWS_SOURCES } from "./sources";
import type {
  DomainId,
  FeedHealth,
  NewsArticle,
  NewsPayload,
  NewsSource,
} from "./types";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
  parseTagValue: false,
});

const TAG_RULES: Array<{ tag: string; pattern: RegExp }> = [
  {
    tag: "LLMs & Reasoning",
    pattern:
      /\b(llm|language model|reasoning|transformer|gpt|claude|gemini|llama|mistral|deepseek|qwen|chain[- ]of[- ]thought|inference|benchmark)\b/i,
  },
  {
    tag: "Agents & Systems",
    pattern:
      /\b(agent|agentic|multi-agent|autonomous|workflow|tool[- ]use|coding assistant|copilot|mcp)\b/i,
  },
  {
    tag: "Chips & Compute",
    pattern:
      /\b(gpu|tpu|npu|nvidia|amd|tsmc|intel|semiconductor|chip|silicon|wafer|datacenter|data center|supercomputer|hbm|blackwell|cuda)\b/i,
  },
  {
    tag: "Energy & Grid",
    pattern:
      /\b(energy|nuclear|fusion|power grid|electricity|cooling|reactor|solar|battery|megawatt|gigawatt)\b/i,
  },
  {
    tag: "Quantum",
    pattern:
      /\b(quantum|qubit|entanglement|superconducting|photonic|error correction|cryogenic|topological)\b/i,
  },
  {
    tag: "Robotics & Embodied",
    pattern:
      /\b(robot|robotics|humanoid|embodied|drone|self-driving|autonomous vehicle|manipulation|actuator)\b/i,
  },
  {
    tag: "Bio & Neuroscience",
    pattern:
      /\b(protein|alphafold|biology|biotech|genom|crispr|neuroscience|brain|bci|clinical|drug discovery|medicine)\b/i,
  },
  {
    tag: "Funding & M&A",
    pattern:
      /\b(raises|funding|series [a-e]|seed round|valuation|billion|million|venture|vc|acquir|acquisition|ipo|startup|founder)\b/i,
  },
  {
    tag: "Policy & Safety",
    pattern:
      /\b(regulation|policy|safety|alignment|eu ai act|copyright|lawsuit|antitrust|governance|sovereign|export control|tariff|security)\b/i,
  },
  {
    tag: "Open Source",
    pattern:
      /\b(open[- ]source|open[- ]weights|hugging face|github|apache 2|mit license|weights|fine-tun|lora)\b/i,
  },
  {
    tag: "Multimodal & Vision",
    pattern:
      /\b(multimodal|vision|video generation|diffusion|image generation|audio|speech|3d|world model)\b/i,
  },
];

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => {
      const n = Number(code);
      return Number.isFinite(n) ? String.fromCharCode(n) : "";
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const n = parseInt(hex, 16);
      return Number.isFinite(n) ? String.fromCharCode(n) : "";
    });
}

function cleanText(raw: unknown): string {
  if (!raw) return "";
  let str = "";
  if (typeof raw === "string") {
    str = raw;
  } else if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if (typeof obj["#text"] === "string") str = obj["#text"];
    else if (typeof obj["__cdata"] === "string") str = obj["__cdata"];
  }
  if (!str) return "";
  const decoded = decodeHtmlEntities(str);
  const withoutTags = decoded.replace(/<[^>]+>/g, " ");
  return decodeHtmlEntities(withoutTags).replace(/\s+/g, " ").trim();
}

function extractLink(item: Record<string, unknown>): string {
  const link = item.link;
  if (typeof link === "string") return link.trim();
  if (Array.isArray(link)) {
    const alt = link.find(
      (l) =>
        typeof l === "object" &&
        l !== null &&
        (l as Record<string, unknown>)["@_rel"] === "alternate"
    ) as Record<string, unknown> | undefined;
    if (alt && typeof alt["@_href"] === "string") return alt["@_href"].trim();
    const first = link[0];
    if (typeof first === "string") return first.trim();
    if (
      typeof first === "object" &&
      first !== null &&
      typeof (first as Record<string, unknown>)["@_href"] === "string"
    ) {
      return String((first as Record<string, unknown>)["@_href"]).trim();
    }
  }
  if (typeof link === "object" && link !== null) {
    const obj = link as Record<string, unknown>;
    if (typeof obj["@_href"] === "string") return obj["@_href"].trim();
    if (typeof obj["#text"] === "string") return obj["#text"].trim();
  }
  if (typeof item.guid === "string" && item.guid.startsWith("http")) {
    return item.guid.trim();
  }
  return "";
}

function extractImageUrl(item: Record<string, unknown>): string | undefined {
  const mediaContent = item["media:content"];
  if (mediaContent) {
    const arr = Array.isArray(mediaContent) ? mediaContent : [mediaContent];
    for (const entry of arr) {
      if (
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as Record<string, unknown>)["@_url"] === "string"
      ) {
        const url = String((entry as Record<string, unknown>)["@_url"]);
        if (url.startsWith("http")) return url;
      }
    }
  }
  const mediaThumb = item["media:thumbnail"];
  if (
    typeof mediaThumb === "object" &&
    mediaThumb !== null &&
    typeof (mediaThumb as Record<string, unknown>)["@_url"] === "string"
  ) {
    const url = String((mediaThumb as Record<string, unknown>)["@_url"]);
    if (url.startsWith("http")) return url;
  }
  const enclosure = item.enclosure;
  if (
    typeof enclosure === "object" &&
    enclosure !== null &&
    typeof (enclosure as Record<string, unknown>)["@_url"] === "string"
  ) {
    const type = String((enclosure as Record<string, unknown>)["@_type"] ?? "");
    const url = String((enclosure as Record<string, unknown>)["@_url"]);
    if (url.startsWith("http") && (!type || type.startsWith("image/"))) {
      return url;
    }
  }
  const rawHtml =
    typeof item["content:encoded"] === "string"
      ? item["content:encoded"]
      : typeof item.description === "string"
      ? item.description
      : "";
  const imgMatch = rawHtml.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
  if (imgMatch?.[1]) return imgMatch[1];
  return undefined;
}

function parseDate(raw: unknown): string {
  const text = cleanText(raw);
  if (!text) return new Date().toISOString();
  const parsed = Date.parse(text);
  if (Number.isNaN(parsed)) return new Date().toISOString();
  // Guard against malformed future dates
  const now = Date.now();
  const clamped = Math.min(parsed, now);
  return new Date(clamped).toISOString();
}

function classifyTags(title: string, summary: string, domain: DomainId): string[] {
  const corpus = `${title} ${summary}`;
  const found: string[] = [];
  for (const rule of TAG_RULES) {
    if (rule.pattern.test(corpus)) {
      found.push(rule.tag);
    }
    if (found.length >= 3) break;
  }
  if (found.length === 0) {
    if (domain === "quantum") found.push("Quantum");
    else if (domain === "entrepreneurship") found.push("Startups & Strategy");
    else if (domain === "ai-research") found.push("Research Paper");
    else if (domain === "major-labs") found.push("Lab Update");
    else if (domain === "adjacent") found.push("Frontier Tech");
    else found.push("Global Tech");
  }
  return found;
}

function estimateReadingTime(title: string, summary: string, kind: NewsSource["kind"]): number {
  const words = `${title} ${summary}`.split(/\s+/).filter(Boolean).length;
  if (kind === "Preprint") return 12;
  if (kind === "Journal") return 6;
  if (words > 90) return 5;
  return 3;
}

function makeArticleId(url: string, title: string): string {
  return crypto
    .createHash("sha1")
    .update(`${url}|${title}`)
    .digest("hex")
    .slice(0, 14);
}

async function fetchSingleFeed(
  source: NewsSource,
  maxItemsPerFeed = 8
): Promise<{ articles: NewsArticle[]; health: FeedHealth }> {
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);

  try {
    const res = await fetch(source.feedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "FrontierBrief/1.0 (+https://vercel.com; AI Research Aggregator)",
        Accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
      next: { revalidate: 900 },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const xml = await res.text();
    const doc = parser.parse(xml) as Record<string, unknown>;

    let rawItems: unknown[] = [];

    // RSS 2.0
    const rss = doc.rss as Record<string, unknown> | undefined;
    if (rss?.channel) {
      const channel = rss.channel as Record<string, unknown>;
      if (channel.item) {
        rawItems = Array.isArray(channel.item) ? channel.item : [channel.item];
      }
    }
    // Atom
    else if (doc.feed) {
      const feed = doc.feed as Record<string, unknown>;
      if (feed.entry) {
        rawItems = Array.isArray(feed.entry) ? feed.entry : [feed.entry];
      }
    }
    // RDF / RSS 1.0 (e.g., older arXiv / Nature feeds)
    else if (doc["rdf:RDF"]) {
      const rdf = doc["rdf:RDF"] as Record<string, unknown>;
      if (rdf.item) {
        rawItems = Array.isArray(rdf.item) ? rdf.item : [rdf.item];
      }
    }

    const articles: NewsArticle[] = [];

    for (const rawEntry of rawItems.slice(0, maxItemsPerFeed)) {
      if (!rawEntry || typeof rawEntry !== "object") continue;
      const item = rawEntry as Record<string, unknown>;

      const title = cleanText(item.title);
      const url = extractLink(item);
      if (!title || !url || !url.startsWith("http")) continue;

      let summary = cleanText(
        item.description ?? item.summary ?? item["content:encoded"] ?? item.content
      );
      // Clean arXiv abstract boilerplate ("arXiv:2611.xxxxx Announce Type: new Abstract: ...")
      summary = summary
        .replace(/^arXiv:\S+\s+Announce Type:\s*\w+\s+Abstract:\s*/i, "")
        .trim();
      if (summary.length > 340) {
        summary = `${summary.slice(0, 337).replace(/\s+\S*$/, "")}...`;
      }

      const publishedAt = parseDate(
        item.pubDate ??
          item.published ??
          item.updated ??
          item["dc:date"] ??
          item.date
      );

      let author = cleanText(
        item["dc:creator"] ??
          item.creator ??
          (typeof item.author === "object" && item.author !== null
            ? (item.author as Record<string, unknown>).name
            : item.author)
      );
      if (author.length > 70) {
        author = `${author.slice(0, 67)}...`;
      }

      const tags = classifyTags(title, summary, source.domain);

      articles.push({
        id: makeArticleId(url, title),
        title,
        summary:
          summary ||
          `Read the latest report from ${source.name} covering ${tags[0].toLowerCase()}.`,
        url,
        publishedAt,
        sourceId: source.id,
        sourceName: source.name,
        sourceKind: source.kind,
        sourceRegion: source.region,
        sourceSiteUrl: source.siteUrl,
        domain: source.domain,
        tags,
        author: author || undefined,
        imageUrl: extractImageUrl(item),
        readingTimeMin: estimateReadingTime(title, summary, source.kind),
        priority: source.priority,
      });
    }

    return {
      articles,
      health: {
        sourceId: source.id,
        sourceName: source.name,
        domain: source.domain,
        ok: articles.length > 0,
        count: articles.length,
        durationMs: Date.now() - started,
      },
    };
  } catch {
    return {
      articles: [],
      health: {
        sourceId: source.id,
        sourceName: source.name,
        domain: source.domain,
        ok: false,
        count: 0,
        durationMs: Date.now() - started,
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchAllNews(domainFilter?: DomainId): Promise<NewsPayload> {
  const targetSources = domainFilter
    ? NEWS_SOURCES.filter((s) => s.domain === domainFilter)
    : NEWS_SOURCES;

  const settled = await Promise.allSettled(
    targetSources.map((source) => fetchSingleFeed(source, 8))
  );

  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const allArticles: NewsArticle[] = [];
  const sourceHealth: FeedHealth[] = [];

  for (const result of settled) {
    if (result.status !== "fulfilled") continue;
    sourceHealth.push(result.value.health);
    for (const article of result.value.articles) {
      const normUrl = article.url.split("?")[0].replace(/\/+$/, "").toLowerCase();
      const normTitle = article.title.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 64);
      if (seenUrls.has(normUrl) || seenTitles.has(normTitle)) continue;
      seenUrls.add(normUrl);
      seenTitles.add(normTitle);
      allArticles.push(article);
    }
  }

  // Sort newest first, with priority tie-breaker for same-hour articles
  allArticles.sort((a, b) => {
    const diff = Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
    if (Math.abs(diff) < 1000 * 60 * 30 && a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return diff;
  });

  const countsByDomain = Object.fromEntries(
    DOMAINS.map((d) => [d.id, 0])
  ) as Record<DomainId, number>;

  for (const art of allArticles) {
    countsByDomain[art.domain] = (countsByDomain[art.domain] ?? 0) + 1;
  }

  return {
    fetchedAt: new Date().toISOString(),
    totalArticles: allArticles.length,
    articles: allArticles,
    countsByDomain,
    sourceHealth,
  };
}
