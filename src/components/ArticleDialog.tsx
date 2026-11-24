"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  Check,
  Clock,
  Download,
  ExternalLink,
  Share2,
  X,
} from "lucide-react";
import { DOMAIN_MAP } from "@/lib/sources";
import { formatFullDate } from "@/lib/format";
import type { NewsArticle } from "@/lib/types";

interface ArticleDialogProps {
  article: NewsArticle | null;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onClose: () => void;
}

export function ArticleDialog({
  article,
  isSaved,
  onToggleSave,
  onClose,
}: ArticleDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (article) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [article]);

  // Mandatory fallback for browsers without native `closedby="any"` support (e.g. Safari)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if ("closedBy" in HTMLDialogElement.prototype) return;

    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const inside =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!inside) {
        dialog.close();
      }
    };

    dialog.addEventListener("click", handleBackdropClick);
    return () => dialog.removeEventListener("click", handleBackdropClick);
  }, []);

  async function handleShareOrCopy() {
    if (!article) return;
    const siteLink =
      typeof window !== "undefined" ? window.location.origin : "";
    const shareText = `${article.title} (${article.sourceName}) — via Frontier Brief`;

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share({
          title: article.title,
          text: shareText,
          url: article.url,
        });
        return;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(
        `${shareText}\n${article.url}\n\nDaily AI & Deep-Tech Briefing: ${siteLink}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable
    }
  }

  const domain = article ? DOMAIN_MAP[article.domain] : null;
  const siteOrigin =
    typeof window !== "undefined" ? window.location.origin : "";
  const ogCardUrl = article
    ? `/api/og?title=${encodeURIComponent(article.title)}&domain=${encodeURIComponent(
        article.domain
      )}&source=${encodeURIComponent(article.sourceName)}&tag=${encodeURIComponent(
        article.tags[0] || ""
      )}`
    : "";

  const xIntentUrl = article
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `${article.title}\n\nvia @FrontierBrief (${article.sourceName}) #AI #MachineLearning`
      )}&url=${encodeURIComponent(article.url)}`
    : "#";

  const linkedInUrl = article
    ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        article.url
      )}`
    : "#";

  const whatsAppUrl = article
    ? `https://wa.me/?text=${encodeURIComponent(
        `*${article.title}*\n${article.sourceName}\n${article.url}\n\nMore AI & Quantum news: ${siteOrigin}`
      )}`
    : "#";

  return (
    <dialog
      ref={dialogRef}
      className="editorial-dialog"
      aria-labelledby="article-dialog-title"
      onClose={onClose}
      {...({ closedby: "any" } as Record<string, string>)}
    >
      {article && domain && (
        <>
          <div className="sheet-grabber" aria-hidden="true" />
          <div className="dialog-header">
            <div>
              <div className="source-badge">
                <span
                  className="domain-dot"
                  style={{ backgroundColor: domain.accentColor }}
                />
                <span>{domain.label}</span>
                <span>·</span>
                <span>{article.sourceName}</span>
                <span className="kind-pill">{article.sourceKind}</span>
              </div>
              <h2 id="article-dialog-title" className="dialog-title">
                {article.title}
              </h2>
            </div>
            <button
              type="button"
              className="icon-btn"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close article preview"
            >
              <X size={16} />
            </button>
          </div>

          <div className="dialog-body">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
                marginBottom: "16px",
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono), monospace",
              }}
            >
              <span>{formatFullDate(article.publishedAt)}</span>
              <span>·</span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Clock size={13} />~{article.readingTimeMin} min read
              </span>
              {article.author && (
                <>
                  <span>·</span>
                  <span>By {article.author}</span>
                </>
              )}
              <span>·</span>
              <span>Region: {article.sourceRegion}</span>
            </div>

            <p className="dialog-summary">{article.summary}</p>

            <div className="card-tags" style={{ marginBottom: "18px" }}>
              {article.tags.map((tag) => (
                <span key={tag} className="mini-tag">
                  {tag}
                </span>
              ))}
            </div>

            {/* Viral Social Distribution Row */}
            <div className="social-share-row" aria-label="Share to social platforms">
              <a
                href={xIntentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="social-pill"
              >
                Post to X
              </a>
              <a
                href={linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="social-pill"
              >
                LinkedIn
              </a>
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="social-pill"
              >
                WhatsApp
              </a>
              <a
                href={ogCardUrl}
                download={`frontier-brief-${article.id}.png`}
                className="social-pill"
              >
                <Download size={13} />
                Share Card PNG
              </a>
            </div>

            <div className="dialog-footer">
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="icon-btn"
                  data-active={isSaved}
                  onClick={() => onToggleSave(article.id)}
                >
                  <Bookmark
                    size={15}
                    fill={isSaved ? "currentColor" : "none"}
                  />
                  {isSaved ? "Saved" : "Save"}
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={handleShareOrCopy}
                >
                  {copied ? <Check size={15} /> : <Share2 size={15} />}
                  {copied ? "Copied" : "Share"}
                </button>
              </div>

              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="primary-link-btn"
              >
                Read full story at {article.sourceName}
                <ExternalLink size={15} />
              </a>
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}
