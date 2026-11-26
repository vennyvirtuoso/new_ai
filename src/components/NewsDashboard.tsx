"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  Check,
  Copy,
  ExternalLink,
  Flame,
  Headphones,
  Layers,
  LayoutGrid,
  List,
  Radio,
  RefreshCw,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { DOMAINS, DOMAIN_MAP } from "@/lib/sources";
import { formatMastheadDate, formatRelativeTime } from "@/lib/format";
import type { DomainId, NewsArticle, NewsPayload } from "@/lib/types";
import { ThemeToggle } from "./ThemeToggle";
import { ArticleDialog } from "./ArticleDialog";
import { SourcesDialog } from "./SourcesDialog";
import { AudioBriefPlayer } from "./AudioBriefPlayer";
import { StackDialog } from "./StackDialog";

type ActiveTab = "all" | DomainId | "saved" | "shared";
type TimeRange = "24h" | "7d" | "30d" | "all";
type ViewMode = "editorial" | "wire";

const SAVED_STORAGE_KEY = "frontier-brief:saved-articles";
const STACK_STORAGE_KEY = "frontier-brief:my-stack";
const ENGAGEMENT_STORAGE_KEY = "frontier-brief:engagement";
const ALL_DOMAIN_IDS = DOMAINS.map((d) => d.id);
const AUTHOR_NAME = "Vijendra Vaishya";
const AUTHOR_URL = process.env.NEXT_PUBLIC_AUTHOR_URL || "";

interface EngagementState {
  streakDays: number;
  lastVisitDate: string; // YYYY-MM-DD
  lastVisitTs: number;
}

interface NewsDashboardProps {
  initialData: NewsPayload;
  initialDomain?: DomainId;
}

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
}

function getYesterdayKey(): string {
  const d = new Date(Date.now() - 86400 * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

export function NewsDashboard({
  initialData,
  initialDomain,
}: NewsDashboardProps) {
  const [data, setData] = useState<NewsPayload>(initialData);
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialDomain ?? "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("editorial");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [sharedIds, setSharedIds] = useState<string[]>([]);
  const [myStack, setMyStack] = useState<DomainId[]>(ALL_DOMAIN_IDS);
  const [streakDays, setStreakDays] = useState<number>(1);
  const [previousVisitTs, setPreviousVisitTs] = useState<number | null>(null);
  const [onlyNewSinceVisit, setOnlyNewSinceVisit] = useState(false);

  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [stackOpen, setStackOpen] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [digestCopied, setDigestCopied] = useState(false);
  const [listSharedFeedback, setListSharedFeedback] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Hydrate saved bookmarks, personalized My Stack, reading streak, and ?list= shared reading lists
  useEffect(() => {
    try {
      const rawSaved = localStorage.getItem(SAVED_STORAGE_KEY);
      if (rawSaved) {
        const parsed = JSON.parse(rawSaved);
        if (Array.isArray(parsed)) setSavedIds(parsed);
      }

      const rawStack = localStorage.getItem(STACK_STORAGE_KEY);
      if (rawStack) {
        const parsed = JSON.parse(rawStack);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((id): id is DomainId => id in DOMAIN_MAP);
          if (valid.length > 0) setMyStack(valid);
        }
      }

      // Daily reading streak & "New since last visit" tracking
      const today = getTodayKey();
      const yesterday = getYesterdayKey();
      const nowTs = Date.now();
      const rawEngagement = localStorage.getItem(ENGAGEMENT_STORAGE_KEY);
      let nextStreak = 1;
      if (rawEngagement) {
        const prev = JSON.parse(rawEngagement) as EngagementState;
        if (prev.lastVisitTs) {
          setPreviousVisitTs(prev.lastVisitTs);
        }
        if (prev.lastVisitDate === today) {
          nextStreak = Math.max(1, prev.streakDays || 1);
        } else if (prev.lastVisitDate === yesterday) {
          nextStreak = (prev.streakDays || 1) + 1;
        } else {
          nextStreak = 1;
        }
      }
      setStreakDays(nextStreak);
      const updated: EngagementState = {
        streakDays: nextStreak,
        lastVisitDate: today,
        lastVisitTs: nowTs,
      };
      localStorage.setItem(ENGAGEMENT_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }

    // Check for shareable reading list query (?list=id1,id2,...)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const listParam = params.get("list");
      if (listParam) {
        const ids = listParam
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (ids.length > 0) {
          setSharedIds(ids);
          setActiveTab("shared");
        }
      }
    }
  }, []);

  function toggleSave(id: string) {
    setSavedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [id, ...prev];
      try {
        localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }

  function handleToggleStackDomain(id: DomainId) {
    setMyStack((prev) => {
      const exists = prev.includes(id);
      if (exists && prev.length === 1) return prev; // Keep at least 1 domain
      const next = exists ? prev.filter((d) => d !== id) : [...prev, id];
      try {
        localStorage.setItem(STACK_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }

  function handleResetStack() {
    setMyStack(ALL_DOMAIN_IDS);
    try {
      localStorage.removeItem(STACK_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }

  async function handleRefresh() {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/news", { cache: "no-store" });
      if (res.ok) {
        const fresh: NewsPayload = await res.json();
        setData(fresh);
      }
    } finally {
      setIsRefreshing(false);
    }
  }

  const savedSet = useMemo(() => new Set(savedIds), [savedIds]);
  const sharedSet = useMemo(() => new Set(sharedIds), [sharedIds]);
  const stackSet = useMemo(() => new Set(myStack), [myStack]);
  const isStackCustomized = myStack.length < DOMAINS.length;

  const newSinceVisitCount = useMemo(() => {
    if (!previousVisitTs) return 0;
    return data.articles.filter((a) => Date.parse(a.publishedAt) > previousVisitTs)
      .length;
  }, [data.articles, previousVisitTs]);

  const activeFiltersCount =
    (selectedTag ? 1 : 0) +
    (selectedSource ? 1 : 0) +
    (timeRange !== "all" ? 1 : 0) +
    (viewMode !== "editorial" ? 1 : 0) +
    (onlyNewSinceVisit ? 1 : 0);

  // Articles belonging to active tab
  const tabArticles = useMemo(() => {
    if (activeTab === "shared") {
      return data.articles.filter((a) => sharedSet.has(a.id));
    }
    if (activeTab === "saved") {
      return data.articles.filter((a) => savedSet.has(a.id));
    }
    if (activeTab === "all") {
      return isStackCustomized
        ? data.articles.filter((a) => stackSet.has(a.domain))
        : data.articles;
    }
    return data.articles.filter((a) => a.domain === activeTab);
  }, [
    data.articles,
    activeTab,
    savedSet,
    sharedSet,
    stackSet,
    isStackCustomized,
  ]);

  const availableTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const art of tabArticles) {
      for (const tag of art.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([tag]) => tag);
  }, [tabArticles]);

  const availableSources = useMemo(() => {
    if (activeTab === "all" || activeTab === "saved" || activeTab === "shared") {
      return [];
    }
    const map = new Map<string, string>();
    for (const art of tabArticles) {
      map.set(art.sourceId, art.sourceName);
    }
    return Array.from(map.entries());
  }, [tabArticles, activeTab]);

  // Apply search, tag, source, new-since-visit, and time range filters
  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const now = Date.now();
    const maxAgeMs =
      timeRange === "24h"
        ? 86400 * 1000
        : timeRange === "7d"
        ? 86400 * 1000 * 7
        : timeRange === "30d"
        ? 86400 * 1000 * 30
        : Infinity;

    return tabArticles.filter((art) => {
      if (selectedTag && !art.tags.includes(selectedTag)) return false;
      if (selectedSource && art.sourceId !== selectedSource) return false;
      if (onlyNewSinceVisit && previousVisitTs) {
        if (Date.parse(art.publishedAt) <= previousVisitTs) return false;
      }
      if (maxAgeMs !== Infinity) {
        const age = now - Date.parse(art.publishedAt);
        if (age > maxAgeMs) return false;
      }
      if (q) {
        const haystack =
          `${art.title} ${art.summary} ${art.sourceName} ${art.author ?? ""} ${art.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [
    tabArticles,
    selectedTag,
    selectedSource,
    timeRange,
    searchQuery,
    onlyNewSinceVisit,
    previousVisitTs,
  ]);

  // Top 6 cross-domain stories for both the Morning Audio Brief and Daily Digest export
  const topBriefingStories = useMemo(() => {
    const preferredDomains = isStackCustomized ? myStack : ALL_DOMAIN_IDS;
    const picks: NewsArticle[] = [];
    for (const domainId of preferredDomains) {
      const top = data.articles.find((a) => a.domain === domainId);
      if (top) picks.push(top);
    }
    for (const art of data.articles) {
      if (picks.length >= 6) break;
      if (!picks.some((p) => p.id === art.id)) picks.push(art);
    }
    return picks.slice(0, 6);
  }, [data.articles, myStack, isStackCustomized]);

  // Pick diverse Lead Briefing stories on the Front Page
  const leadBriefing = useMemo(() => {
    if (
      activeTab !== "all" ||
      viewMode !== "editorial" ||
      searchQuery.trim() !== "" ||
      selectedTag !== null ||
      timeRange !== "all" ||
      onlyNewSinceVisit
    ) {
      return null;
    }
    const usedDomains = new Set<DomainId>();
    const picks: NewsArticle[] = [];
    for (const art of filteredArticles) {
      if (picks.length >= 4) break;
      if (!usedDomains.has(art.domain)) {
        picks.push(art);
        usedDomains.add(art.domain);
      }
    }
    if (picks.length < 4) {
      for (const art of filteredArticles) {
        if (picks.length >= 4) break;
        if (!picks.some((p) => p.id === art.id)) picks.push(art);
      }
    }
    return picks;
  }, [
    activeTab,
    viewMode,
    searchQuery,
    selectedTag,
    timeRange,
    onlyNewSinceVisit,
    filteredArticles,
  ]);

  async function handleCopyDailyDigest() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const lines = [
      `Frontier Brief — ${formatMastheadDate()}`,
      `Top Worldwide AI, Quantum & Deep-Tech Stories:`,
      "",
      ...topBriefingStories.map((art, i) => {
        const label = DOMAIN_MAP[art.domain]?.shortLabel ?? "Tech";
        return `${i + 1}. [${label}] ${art.title} (${art.sourceName})\n   ${art.url}`;
      }),
      "",
      `Read the full live briefing (28 feeds): ${origin}`,
    ];
    const digestText = lines.join("\n");

    try {
      await navigator.clipboard.writeText(digestText);
      setDigestCopied(true);
      setTimeout(() => setDigestCopied(false), 2200);
    } catch {
      // Fallback for restricted clipboard contexts
    }
  }

  async function handleShareReadingList() {
    if (savedIds.length === 0 || typeof window === "undefined") return;
    const shareUrl = `${window.location.origin}/?list=${encodeURIComponent(
      savedIds.slice(0, 20).join(",")
    )}`;
    const shareText = `My Frontier Brief AI & Deep-Tech Reading List (${savedIds.length} stories)`;

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Frontier Brief — Curated Reading List",
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setListSharedFeedback(true);
      setTimeout(() => setListSharedFeedback(false), 2200);
    } catch {
      // Ignore
    }
  }

  function handleSaveAllShared() {
    setSavedIds((prev) => {
      const merged = Array.from(new Set([...sharedIds, ...prev]));
      try {
        localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // Ignore
      }
      return merged;
    });
  }

  const liveSourcesCount = data.sourceHealth.filter((s) => s.ok).length;
  const isFrontPageOrganized =
    activeTab === "all" &&
    viewMode === "editorial" &&
    searchQuery.trim() === "" &&
    selectedTag === null &&
    timeRange === "all" &&
    !onlyNewSinceVisit;

  const visibleFrontDomains = useMemo(
    () => DOMAINS.filter((d) => stackSet.has(d.id)),
    [stackSet]
  );

  function handleSelectTab(tab: ActiveTab) {
    setActiveTab(tab);
    setSelectedTag(null);
    setSelectedSource(null);
    setOnlyNewSinceVisit(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <header className="masthead">
        <div className="container">
          <div className="masthead-top">
            <div className="brand-group">
              <div className="brand-eyebrow">
                <span className="live-dot" aria-hidden="true" />
                <span>{formatMastheadDate()}</span>
                <span>·</span>
                <span>
                  {liveSourcesCount}/{data.sourceHealth.length} feeds live
                </span>
              </div>
              <h1 className="brand-title">Frontier Brief</h1>
              <p className="brand-subtitle">
                Worldwide AI/ML research, major labs, quantum physics, adjacent
                frontier tech &amp; entrepreneurship.
              </p>
            </div>

            <div className="masthead-actions">
              <button
                type="button"
                className="icon-btn desktop-only-btn"
                onClick={() => setSourcesOpen(true)}
              >
                <Radio size={15} />
                Sources
                <span className="badge-count">{liveSourcesCount}</span>
              </button>

              <button
                type="button"
                className="icon-btn desktop-only-btn"
                data-active={activeTab === "saved"}
                onClick={() =>
                  handleSelectTab(activeTab === "saved" ? "all" : "saved")
                }
              >
                <Bookmark size={15} />
                Saved
                <span className="badge-count">{savedIds.length}</span>
              </button>

              <button
                type="button"
                className="icon-btn"
                onClick={handleRefresh}
                disabled={isRefreshing}
                aria-label="Refresh live feeds"
                title="Refresh live feeds"
              >
                <RefreshCw size={15} className={isRefreshing ? "spin" : ""} />
                <span className="btn-label-desktop">
                  {isRefreshing ? "Updating" : "Refresh"}
                </span>
              </button>

              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Sticky Domain Navigation */}
      <nav className="domain-nav-wrap" aria-label="News domains">
        <div className="container">
          <div className="domain-nav">
            <button
              type="button"
              className="domain-tab"
              aria-pressed={activeTab === "all"}
              onClick={() => handleSelectTab("all")}
            >
              <Sparkles size={14} />
              <span>{isStackCustomized ? "My Stack" : "Front Page"}</span>
              <span className="tab-count">{data.totalArticles}</span>
            </button>

            {DOMAINS.map((domain) => (
              <button
                key={domain.id}
                type="button"
                className="domain-tab"
                aria-pressed={activeTab === domain.id}
                onClick={() => handleSelectTab(domain.id)}
              >
                <span
                  className="domain-dot"
                  style={{ backgroundColor: domain.accentColor }}
                />
                <span>{domain.shortLabel}</span>
                <span className="tab-count">
                  {data.countsByDomain[domain.id] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Researcher Pulse & Growth Utility Strip */}
      <section className="container">
        <div className="pulse-strip" aria-label="Daily briefing tools">
          <div className="pulse-metrics">
            <span className="pulse-pill streak-pill" title="Daily reading streak">
              <Flame size={13} />
              <span>{streakDays}-day streak</span>
            </span>

            {newSinceVisitCount > 0 && (
              <button
                type="button"
                className="pulse-pill"
                data-active={onlyNewSinceVisit}
                onClick={() => setOnlyNewSinceVisit((v) => !v)}
              >
                <span>+{newSinceVisitCount} new since last visit</span>
              </button>
            )}
          </div>

          <div className="pulse-actions">
            <button
              type="button"
              className="pulse-pill"
              data-active={audioOpen}
              onClick={() => setAudioOpen((v) => !v)}
            >
              <Headphones size={13} />
              <span>Listen (3m)</span>
            </button>

            <button
              type="button"
              className="pulse-pill"
              data-active={digestCopied}
              onClick={handleCopyDailyDigest}
            >
              {digestCopied ? <Check size={13} /> : <Copy size={13} />}
              <span>{digestCopied ? "Digest copied!" : "Copy Digest"}</span>
            </button>

            <button
              type="button"
              className="pulse-pill"
              data-active={isStackCustomized}
              onClick={() => setStackOpen(true)}
            >
              <Layers size={13} />
              <span>
                {isStackCustomized
                  ? `My Stack (${myStack.length}/6)`
                  : "My Stack"}
              </span>
            </button>
          </div>
        </div>

        {audioOpen && (
          <AudioBriefPlayer
            stories={topBriefingStories}
            onClose={() => setAudioOpen(false)}
            onSelectArticle={(article) => setActiveArticle(article)}
          />
        )}
      </section>

      {/* Filter & Search Toolbar */}
      <section className="container">
        <div className="toolbar">
          <div className="toolbar-row">
            <div className="search-row">
              <div className="search-box">
                <Search size={15} className="search-icon" />
                <input
                  ref={searchInputRef}
                  type="search"
                  className="search-input"
                  placeholder="Search AI, quantum, chips, startups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search articles"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="search-clear"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <button
                type="button"
                className="mobile-filter-toggle"
                data-active={mobileFiltersOpen || activeFiltersCount > 0}
                aria-expanded={mobileFiltersOpen}
                onClick={() => setMobileFiltersOpen((v) => !v)}
              >
                <SlidersHorizontal size={15} />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="badge-count">{activeFiltersCount}</span>
                )}
              </button>
            </div>

            <div
              className="toolbar-controls mobile-collapsible"
              data-open={mobileFiltersOpen}
            >
              <div className="segmented" role="group" aria-label="Time range">
                {(["24h", "7d", "30d", "all"] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    type="button"
                    className="segmented-btn"
                    aria-pressed={timeRange === range}
                    onClick={() => setTimeRange(range)}
                  >
                    {range === "all" ? "All time" : range}
                  </button>
                ))}
              </div>

              <div className="segmented" role="group" aria-label="View layout">
                <button
                  type="button"
                  className="segmented-btn"
                  aria-pressed={viewMode === "editorial"}
                  onClick={() => setViewMode("editorial")}
                >
                  <LayoutGrid size={14} />
                  Editorial
                </button>
                <button
                  type="button"
                  className="segmented-btn"
                  aria-pressed={viewMode === "wire"}
                  onClick={() => setViewMode("wire")}
                >
                  <List size={14} />
                  Wire
                </button>
              </div>
            </div>
          </div>

          {/* Topic Sub-tags */}
          {availableTags.length > 0 && (
            <div
              className="tag-strip mobile-collapsible"
              data-open={mobileFiltersOpen}
              role="group"
              aria-label="Filter by topic"
            >
              <button
                type="button"
                className="tag-chip"
                aria-pressed={selectedTag === null}
                onClick={() => setSelectedTag(null)}
              >
                All topics
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="tag-chip"
                  aria-pressed={selectedTag === tag}
                  onClick={() =>
                    setSelectedTag((prev) => (prev === tag ? null : tag))
                  }
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Source Filter (shown inside a specific domain) */}
          {availableSources.length > 1 && (
            <div
              className="tag-strip mobile-collapsible"
              data-open={mobileFiltersOpen}
              role="group"
              aria-label="Filter by source"
            >
              <button
                type="button"
                className="tag-chip"
                aria-pressed={selectedSource === null}
                onClick={() => setSelectedSource(null)}
              >
                All sources ({availableSources.length})
              </button>
              {availableSources.map(([id, name]) => (
                <button
                  key={id}
                  type="button"
                  className="tag-chip"
                  aria-pressed={selectedSource === id}
                  onClick={() =>
                    setSelectedSource((prev) => (prev === id ? null : id))
                  }
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main Reading Canvas */}
      <main className="container main-content">
        {/* Shared Reading List Header */}
        {activeTab === "shared" && (
          <div className="section-header" style={{ marginBottom: "24px" }}>
            <div>
              <h2 className="section-title">Shared Reading List</h2>
              <p className="section-desc">
                Someone shared {filteredArticles.length} curated stories from
                Frontier Brief with you.
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="icon-btn"
                onClick={handleSaveAllShared}
              >
                <Bookmark size={14} />
                Save all to my list
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => handleSelectTab("all")}
              >
                Back to Front Page
              </button>
            </div>
          </div>
        )}

        {/* Domain intro header when viewing a single domain */}
        {activeTab !== "all" &&
          activeTab !== "saved" &&
          activeTab !== "shared" && (
            <div className="section-header" style={{ marginBottom: "24px" }}>
              <div>
                <div className="section-title-row">
                  <span
                    className="section-bar"
                    style={{
                      backgroundColor: DOMAIN_MAP[activeTab].accentColor,
                    }}
                  />
                  <h2 className="section-title">
                    {DOMAIN_MAP[activeTab].label}
                  </h2>
                </div>
                <p className="section-desc">
                  {DOMAIN_MAP[activeTab].description}
                </p>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                }}
              >
                {filteredArticles.length} stories
              </span>
            </div>
          )}

        {activeTab === "saved" && (
          <div className="section-header" style={{ marginBottom: "24px" }}>
            <div>
              <h2 className="section-title">Saved Reading List</h2>
              <p className="section-desc">
                Articles you bookmarked in this browser for deep reading.
              </p>
            </div>
            {savedIds.length > 0 && (
              <button
                type="button"
                className="icon-btn"
                data-active={listSharedFeedback}
                onClick={handleShareReadingList}
              >
                {listSharedFeedback ? (
                  <Check size={14} />
                ) : (
                  <Share2 size={14} />
                )}
                {listSharedFeedback
                  ? "Share link copied!"
                  : "Share Reading List"}
              </button>
            )}
          </div>
        )}

        {/* Empty State */}
        {filteredArticles.length === 0 ? (
          <div className="empty-state">
            <h3>No stories match your current filters</h3>
            <p>
              {activeTab === "saved"
                ? "Click the bookmark icon on any article to build and share your personal research reading list."
                : "Try clearing your search query, switching to All time, or resetting the topic tag."}
            </p>
            <button
              type="button"
              className="icon-btn"
              onClick={() => {
                setSearchQuery("");
                setSelectedTag(null);
                setSelectedSource(null);
                setTimeRange("all");
                setOnlyNewSinceVisit(false);
                if (activeTab === "saved" || activeTab === "shared") {
                  setActiveTab("all");
                }
              }}
            >
              Reset filters
            </button>
          </div>
        ) : isFrontPageOrganized && leadBriefing ? (
          <>
            {/* Lead Briefing Hero + 3 Cross-Domain Highlights */}
            <section aria-label="Top researcher briefing" className="lead-grid">
              {(() => {
                const hero = leadBriefing[0];
                const heroDomain = DOMAIN_MAP[hero.domain];
                return (
                  <article
                    className="hero-card"
                    onClick={() => setActiveArticle(hero)}
                  >
                    <div>
                      <div className="card-meta-top">
                        <span className="source-badge">
                          <span
                            className="domain-dot"
                            style={{ backgroundColor: heroDomain.accentColor }}
                          />
                          <span>{heroDomain.label}</span>
                          <span>·</span>
                          <span>{hero.sourceName}</span>
                        </span>
                        <span className="kind-pill">{hero.sourceKind}</span>
                      </div>
                      <h2 className="hero-title">{hero.title}</h2>
                      <p className="hero-summary">{hero.summary}</p>
                    </div>
                    <div>
                      <div className="card-tags">
                        {hero.tags.map((tag) => (
                          <span key={tag} className="mini-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="card-footer">
                        <span>
                          {formatRelativeTime(hero.publishedAt)} ·{" "}
                          {hero.readingTimeMin} min read
                        </span>
                        <div className="card-actions">
                          <button
                            type="button"
                            className="micro-btn"
                            data-saved={savedSet.has(hero.id)}
                            aria-label="Bookmark article"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSave(hero.id);
                            }}
                          >
                            <Bookmark
                              size={15}
                              fill={
                                savedSet.has(hero.id) ? "currentColor" : "none"
                              }
                            />
                          </button>
                          <a
                            href={hero.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="micro-btn"
                            aria-label="Open original article"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={15} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })()}

              <div className="highlights-stack">
                {leadBriefing.slice(1).map((item) => {
                  const d = DOMAIN_MAP[item.domain];
                  return (
                    <article
                      key={item.id}
                      className="highlight-card"
                      onClick={() => setActiveArticle(item)}
                    >
                      <div className="card-meta-top" style={{ marginBottom: 0 }}>
                        <span className="source-badge">
                          <span
                            className="domain-dot"
                            style={{ backgroundColor: d.accentColor }}
                          />
                          <span>{d.shortLabel}</span>
                          <span>·</span>
                          <span>{item.sourceName}</span>
                        </span>
                        <span className="wire-time">
                          {formatRelativeTime(item.publishedAt)}
                        </span>
                      </div>
                      <h3 className="highlight-title">{item.title}</h3>
                      <div className="card-tags" style={{ marginBottom: 0 }}>
                        {item.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="mini-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* Organized Domain-by-Domain Sections (respecting My Stack) */}
            {visibleFrontDomains.map((domain) => {
              const domainItems = data.articles
                .filter((a) => a.domain === domain.id)
                .slice(0, 4);
              if (domainItems.length === 0) return null;

              return (
                <section
                  key={domain.id}
                  className="domain-section"
                  aria-labelledby={`section-${domain.id}`}
                >
                  <div className="section-header">
                    <div>
                      <div className="section-title-row">
                        <span
                          className="section-bar"
                          style={{ backgroundColor: domain.accentColor }}
                        />
                        <h2
                          id={`section-${domain.id}`}
                          className="section-title"
                        >
                          {domain.label}
                        </h2>
                      </div>
                      <p className="section-desc">{domain.description}</p>
                    </div>
                    <button
                      type="button"
                      className="section-more-btn"
                      onClick={() => handleSelectTab(domain.id)}
                    >
                      All {data.countsByDomain[domain.id]} stories
                      <ArrowRight size={15} />
                    </button>
                  </div>

                  <div className="article-grid">
                    {domainItems.map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        isSaved={savedSet.has(article.id)}
                        onOpen={() => setActiveArticle(article)}
                        onToggleSave={() => toggleSave(article.id)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        ) : viewMode === "wire" ? (
          <div className="wire-list">
            {filteredArticles.map((article) => {
              const d = DOMAIN_MAP[article.domain];
              return (
                <article
                  key={article.id}
                  className="wire-row"
                  onClick={() => setActiveArticle(article)}
                >
                  <span className="wire-time">
                    {formatRelativeTime(article.publishedAt)}
                  </span>
                  <div className="wire-main">
                    <h3 className="wire-title">{article.title}</h3>
                    <div className="wire-sub">
                      <span
                        className="domain-dot"
                        style={{ backgroundColor: d.accentColor }}
                      />
                      <strong>{article.sourceName}</strong>
                      <span>·</span>
                      <span>{d.shortLabel}</span>
                      {article.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="mini-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="card-actions">
                    <button
                      type="button"
                      className="micro-btn"
                      data-saved={savedSet.has(article.id)}
                      aria-label="Bookmark article"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSave(article.id);
                      }}
                    >
                      <Bookmark
                        size={15}
                        fill={
                          savedSet.has(article.id) ? "currentColor" : "none"
                        }
                      />
                    </button>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="micro-btn"
                      aria-label="Open original article"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={15} />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="article-grid">
            {filteredArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                isSaved={savedSet.has(article.id)}
                onOpen={() => setActiveArticle(article)}
                onToggleSave={() => toggleSave(article.id)}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-domains" aria-label="Direct domain links">
            {DOMAINS.map((domain) => (
              <a
                key={domain.id}
                href={`/domain/${domain.id}`}
                className="footer-domain-link"
              >
                {domain.label}
              </a>
            ))}
          </div>
          <div className="footer-inner">
            <span>
              Frontier Brief · Curated by{" "}
              {AUTHOR_URL ? (
                <a
                  href={AUTHOR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-credit-link"
                >
                  {AUTHOR_NAME}
                </a>
              ) : (
                <span className="footer-credit-name">{AUTHOR_NAME}</span>
              )}
              {AUTHOR_URL && (
                <>
                  {" · "}
                  <a
                    href={AUTHOR_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-credit-link"
                  >
                    Suggest a feed
                  </a>
                </>
              )}
            </span>
            <span>
              Last synced: {formatRelativeTime(data.fetchedAt)} · All headlines
              link directly to original publishers
            </span>
          </div>
        </div>
      </footer>

      <ArticleDialog
        article={activeArticle}
        isSaved={activeArticle ? savedSet.has(activeArticle.id) : false}
        onToggleSave={toggleSave}
        onClose={() => setActiveArticle(null)}
      />

      <SourcesDialog
        open={sourcesOpen}
        sourceHealth={data.sourceHealth}
        onClose={() => setSourcesOpen(false)}
      />

      <StackDialog
        open={stackOpen}
        selectedDomains={myStack}
        onToggleDomain={handleToggleStackDomain}
        onReset={handleResetStack}
        onClose={() => setStackOpen(false)}
      />

      {/* Native-style iPhone / Android Bottom Tab Bar */}
      <nav className="mobile-bottom-bar" aria-label="Mobile quick navigation">
        <button
          type="button"
          className="mobile-tab-btn"
          data-active={activeTab === "all"}
          onClick={() => handleSelectTab("all")}
        >
          <Sparkles size={19} />
          <span>Briefing</span>
        </button>

        <button
          type="button"
          className="mobile-tab-btn"
          data-active={audioOpen}
          onClick={() => setAudioOpen((v) => !v)}
        >
          <Headphones size={19} />
          <span>Listen</span>
        </button>

        <button
          type="button"
          className="mobile-tab-btn"
          data-active={activeTab === "saved"}
          onClick={() =>
            handleSelectTab(activeTab === "saved" ? "all" : "saved")
          }
        >
          <Bookmark size={19} />
          <span>Saved</span>
          {savedIds.length > 0 && (
            <span className="mobile-tab-badge">{savedIds.length}</span>
          )}
        </button>

        <button
          type="button"
          className="mobile-tab-btn"
          data-active={sourcesOpen}
          onClick={() => setSourcesOpen(true)}
        >
          <Radio size={19} />
          <span>Sources</span>
        </button>
      </nav>
    </>
  );
}

interface ArticleCardProps {
  article: NewsArticle;
  isSaved: boolean;
  onOpen: () => void;
  onToggleSave: () => void;
}

function ArticleCard({
  article,
  isSaved,
  onOpen,
  onToggleSave,
}: ArticleCardProps) {
  const domain = DOMAIN_MAP[article.domain];
  return (
    <article className="article-card" onClick={onOpen}>
      <div>
        <div className="card-meta-top">
          <span className="source-badge">
            <span
              className="domain-dot"
              style={{ backgroundColor: domain.accentColor }}
            />
            <span>{article.sourceName}</span>
          </span>
          <span className="kind-pill">{article.sourceKind}</span>
        </div>

        <h3 className="card-title">{article.title}</h3>
        <p className="card-summary">{article.summary}</p>
      </div>

      <div>
        <div className="card-tags">
          {article.tags.map((tag) => (
            <span key={tag} className="mini-tag">
              {tag}
            </span>
          ))}
        </div>

        <div className="card-footer">
          <span>
            {formatRelativeTime(article.publishedAt)} · {article.readingTimeMin}
            m
          </span>
          <div className="card-actions">
            <button
              type="button"
              className="micro-btn"
              data-saved={isSaved}
              aria-label="Bookmark article"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave();
              }}
            >
              <Bookmark size={15} fill={isSaved ? "currentColor" : "none"} />
            </button>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="micro-btn"
              aria-label="Open original article"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={15} />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
