export type DomainId =
  | "ai-research"
  | "major-labs"
  | "quantum"
  | "adjacent"
  | "entrepreneurship"
  | "worldwide";

export interface DomainMeta {
  id: DomainId;
  label: string;
  shortLabel: string;
  description: string;
  accentColor: string;
}

export interface NewsSource {
  id: string;
  name: string;
  domain: DomainId;
  feedUrl: string;
  siteUrl: string;
  kind: "Preprint" | "Lab" | "Publication" | "Journal" | "Community" | "Wire";
  region: "Global" | "US" | "UK" | "EU";
  priority: number; // 1 = highest signal
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string; // ISO 8601
  sourceId: string;
  sourceName: string;
  sourceKind: NewsSource["kind"];
  sourceRegion: NewsSource["region"];
  sourceSiteUrl: string;
  domain: DomainId;
  tags: string[];
  author?: string;
  imageUrl?: string;
  readingTimeMin: number;
  priority: number;
}

export interface FeedHealth {
  sourceId: string;
  sourceName: string;
  domain: DomainId;
  ok: boolean;
  count: number;
  durationMs: number;
}

export interface NewsPayload {
  fetchedAt: string;
  totalArticles: number;
  articles: NewsArticle[];
  countsByDomain: Record<DomainId, number>;
  sourceHealth: FeedHealth[];
}
