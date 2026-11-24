"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  ExternalLink,
  LayoutGrid,
  List,
  Radio,
  RefreshCw,
  Search,
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

type ActiveTab = "all" | DomainId | "saved";
type TimeRange = "24h" | "7d" | "30d" | "all";
type ViewMode = "editorial" | "wire";

const SAVED_STORAGE_KEY = "frontier-brief:saved-articles";

interface NewsDashboardProps {
  initialData: NewsPayload;
}

export function NewsDashboard({ initialData }: NewsDashboardProps) {
  const [data, setData] = useState<NewsPayload>(initialData);
  const [activeTab, setActiveTab] = useState<ActiveTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("editorial");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeFiltersCount =
    (selectedTag ? 1 : 0) +
    (selectedSource ? 1 : 0) +
    (timeRange !== "all" ? 1 : 0) +
    (viewMode !== "editorial" ? 1 : 0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSavedIds(parsed);
      }
    } catch {
      // Ignore storage read errors
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
        // Ignore storage write errors
      }
      return next;
    });
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

  // Compute available tags from current tab's articles
  const tabArticles = useMemo(() => {
    if (activeTab === "all") return data.articles;
    if (activeTab === "saved") {
      return data.articles.filter((a) => savedSet.has(a.id));
    }
    return data.articles.filter((a) => a.domain === activeTab);
  }, [data.articles, activeTab, savedSet]);

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
    if (activeTab === "all" || activeTab === "saved") return [];
    const map = new Map<string, string>();
    for (const art of tabArticles) {
      map.set(art.sourceId, art.sourceName);
    }
    return Array.from(map.entries());
  }, [tabArticles, activeTab]);

  // Apply search, tag, source, and time range filters
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
  }, [tabArticles, selectedTag, selectedSource, timeRange, searchQuery]);

  // Pick diverse Lead Briefing stories on the Front Page
  const leadBriefing = useMemo(() => {
    if (
      activeTab !== "all" ||
      viewMode !== "editorial" ||
      searchQuery.trim() !== "" ||
      selectedTag !== null ||
      timeRange !== "all"
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
    filteredArticles,
  ]);

  const liveSourcesCount = data.sourceHealth.filter((s) => s.ok).length;
  const isFrontPageOrganized =
    activeTab === "all" &&
    viewMode === "editorial" &&
    searchQuery.trim() === "" &&
    selectedTag === null &&
    timeRange === "all";

  function handleSelectTab(tab: ActiveTab) {
    setActiveTab(tab);
    setSelectedTag(null);
    setSelectedSource(null);
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
              <span>Front Page</span>
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
              className="tag-strip"
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
        {/* Domain intro header when viewing a single domain */}
        {activeTab !== "all" && activeTab !== "saved" && (
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
          </div>
        )}

        {/* Empty State */}
        {filteredArticles.length === 0 ? (
          <div className="empty-state">
            <h3>No stories match your current filters</h3>
            <p>
              {activeTab === "saved"
                ? "Click the bookmark icon on any article to build your personal research reading list."
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
                if (activeTab === "saved") setActiveTab("all");
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

            {/* Organized Domain-by-Domain Sections */}
            {DOMAINS.map((domain) => {
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
        <div className="container footer-inner">
          <span>
            Frontier Brief · Live RSS/Atom aggregator for AI/ML researchers ·
            Ready for Vercel Edge
          </span>
          <span>
            Last synced: {formatRelativeTime(data.fetchedAt)} · All headlines
            link directly to original publishers
          </span>
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
          data-active={viewMode === "wire" && activeTab !== "saved"}
          onClick={() => {
            setViewMode((prev) => (prev === "wire" ? "editorial" : "wire"));
            if (activeTab === "saved") setActiveTab("all");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <List size={19} />
          <span>{viewMode === "wire" ? "Editorial" : "Wire"}</span>
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
