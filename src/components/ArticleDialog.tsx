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
  const downloadingRef = useRef(false);
  const [copied, setCopied] = useState(false);
  const [downloadingCard, setDownloadingCard] = useState(false);

  function getActiveTheme(): "light" | "dark" {
    if (typeof document === "undefined") return "light";
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="color-scheme"]'
    );
    if (meta?.content === "dark") return "dark";
    if (meta?.content === "light") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

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

  async function handleDownloadCard() {
    if (!article || !ogCardUrl || downloadingRef.current) return;
    downloadingRef.current = true;
    setDownloadingCard(true);
    try {
      const theme = getActiveTheme();
      const themedUrl = `${ogCardUrl}&theme=${theme}`;
      const res = await fetch(themedUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const filename = `frontier-brief-${article.id}.png`;

      // On touch devices (iPhone/Android), use native Share Sheet so users can Save Image to Photos
      const isTouchDevice =
        typeof window !== "undefined" &&
        window.matchMedia("(pointer: coarse)").matches;

      if (
        isTouchDevice &&
        typeof File !== "undefined" &&
        typeof navigator !== "undefined"
      ) {
        const file = new File([blob], filename, { type: "image/png" });
        if (
          typeof navigator.canShare === "function" &&
          navigator.canShare({ files: [file] })
        ) {
          try {
            await navigator.share({
              files: [file],
              title: article.title,
            });
            return;
          } catch (err) {
            if ((err as Error)?.name === "AbortError") return;
          }
        }
      }

      // Single clean Blob download (no Content-Disposition header on fetch to prevent duplicate saves)
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    } finally {
      downloadingRef.current = false;
      setDownloadingCard(false);
    }
  }

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
              <button
                type="button"
                className="social-pill"
                onClick={handleDownloadCard}
                disabled={downloadingCard}
              >
                <Download size={13} />
                {downloadingCard ? "Saving PNG..." : "Share Card PNG"}
              </button>
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
