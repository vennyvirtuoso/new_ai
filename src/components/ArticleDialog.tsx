"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  Check,
  Clock,
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

  async function handleCopyLink() {
    if (!article) return;
    try {
      await navigator.clipboard.writeText(article.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable
    }
  }

  const domain = article ? DOMAIN_MAP[article.domain] : null;

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
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <Clock size={13} />
                ~{article.readingTimeMin} min read
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

            <div className="card-tags" style={{ marginBottom: "22px" }}>
              {article.tags.map((tag) => (
                <span key={tag} className="mini-tag">
                  {tag}
                </span>
              ))}
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
                  {isSaved ? "Saved" : "Save for later"}
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={handleCopyLink}
                >
                  {copied ? <Check size={15} /> : <Share2 size={15} />}
                  {copied ? "Copied" : "Copy link"}
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
