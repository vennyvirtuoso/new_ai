"use client";

import { useEffect, useRef } from "react";
import { ExternalLink, Radio, X } from "lucide-react";
import { DOMAINS, NEWS_SOURCES } from "@/lib/sources";
import type { FeedHealth } from "@/lib/types";

interface SourcesDialogProps {
  open: boolean;
  sourceHealth: FeedHealth[];
  onClose: () => void;
}

export function SourcesDialog({
  open,
  sourceHealth,
  onClose,
}: SourcesDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

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

  const healthById = new Map(sourceHealth.map((h) => [h.sourceId, h]));
  const liveCount = sourceHealth.filter((h) => h.ok).length;

  return (
    <dialog
      ref={dialogRef}
      className="editorial-dialog"
      aria-labelledby="sources-dialog-title"
      onClose={onClose}
      {...({ closedby: "any" } as Record<string, string>)}
    >
      <div className="dialog-header">
        <div>
          <div className="source-badge">
            <Radio size={14} style={{ color: "var(--ok-color)" }} />
            <span>
              {liveCount} of {NEWS_SOURCES.length} feeds reporting live
            </span>
          </div>
          <h2 id="sources-dialog-title" className="dialog-title">
            Curated News Providers & Feeds
          </h2>
        </div>
        <button
          type="button"
          className="icon-btn"
          onClick={() => dialogRef.current?.close()}
          aria-label="Close sources directory"
        >
          <X size={16} />
        </button>
      </div>

      <div className="dialog-body">
        <p
          style={{
            marginTop: 0,
            marginBottom: "20px",
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
          }}
        >
          Frontier Brief pulls directly from official RSS/Atom feeds of leading
          research preprints, AI labs, scientific journals, and global tech
          publications—cached every 15 minutes at the Vercel edge.
        </p>

        {DOMAINS.map((domain) => {
          const sources = NEWS_SOURCES.filter((s) => s.domain === domain.id);
          return (
            <div key={domain.id} className="sources-domain-group">
              <h3 className="sources-domain-title">
                <span
                  className="domain-dot"
                  style={{
                    backgroundColor: domain.accentColor,
                    display: "inline-block",
                    marginRight: "8px",
                  }}
                />
                {domain.label}
              </h3>
              <div className="sources-list">
                {sources.map((src) => {
                  const health = healthById.get(src.id);
                  const ok = health?.ok ?? false;
                  return (
                    <a
                      key={src.id}
                      href={src.siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="source-item"
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontWeight: 500,
                        }}
                      >
                        {src.name}
                        <ExternalLink size={12} style={{ opacity: 0.6 }} />
                      </span>
                      <span className="status-pill" data-ok={ok}>
                        {ok ? `${health?.count ?? 0} live` : "idle"}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </dialog>
  );
}
