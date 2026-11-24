"use client";

import { useEffect, useRef } from "react";
import { Check, Layers, RotateCcw, X } from "lucide-react";
import { DOMAINS } from "@/lib/sources";
import type { DomainId } from "@/lib/types";

interface StackDialogProps {
  open: boolean;
  selectedDomains: DomainId[];
  onToggleDomain: (id: DomainId) => void;
  onReset: () => void;
  onClose: () => void;
}

export function StackDialog({
  open,
  selectedDomains,
  onToggleDomain,
  onReset,
  onClose,
}: StackDialogProps) {
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

  // Mandatory Safari fallback for `closedby="any"`
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

  const selectedSet = new Set(selectedDomains);

  return (
    <dialog
      ref={dialogRef}
      className="editorial-dialog"
      aria-labelledby="stack-dialog-title"
      onClose={onClose}
      {...({ closedby: "any" } as Record<string, string>)}
    >
      <div className="sheet-grabber" aria-hidden="true" />
      <div className="dialog-header">
        <div>
          <div className="source-badge">
            <Layers size={14} style={{ color: "var(--accent-ink)" }} />
            <span>Personalize your Front Page</span>
          </div>
          <h2 id="stack-dialog-title" className="dialog-title">
            My Research Stack
          </h2>
        </div>
        <button
          type="button"
          className="icon-btn"
          onClick={() => dialogRef.current?.close()}
          aria-label="Close My Stack settings"
        >
          <X size={16} />
        </button>
      </div>

      <div className="dialog-body">
        <p
          style={{
            marginTop: 0,
            marginBottom: "16px",
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
          }}
        >
          Pin the domains you care about most. Your Front Page briefing and
          Morning Audio Brief will automatically prioritize your stack.
        </p>

        <div className="stack-grid">
          {DOMAINS.map((domain) => {
            const active = selectedSet.has(domain.id);
            return (
              <button
                key={domain.id}
                type="button"
                className="stack-option"
                data-selected={active}
                onClick={() => onToggleDomain(domain.id)}
              >
                <div className="stack-option-head">
                  <span className="source-badge">
                    <span
                      className="domain-dot"
                      style={{ backgroundColor: domain.accentColor }}
                    />
                    <strong style={{ color: "var(--text-primary)" }}>
                      {domain.label}
                    </strong>
                  </span>
                  <span className="stack-check" data-selected={active}>
                    {active && <Check size={13} />}
                  </span>
                </div>
                <p className="stack-option-desc">{domain.description}</p>
              </button>
            );
          })}
        </div>

        <div className="dialog-footer" style={{ marginTop: "18px" }}>
          <button type="button" className="icon-btn" onClick={onReset}>
            <RotateCcw size={14} />
            Show all 6 domains
          </button>
          <button
            type="button"
            className="primary-link-btn"
            style={{ border: "none", cursor: "pointer" }}
            onClick={() => dialogRef.current?.close()}
          >
            Save Stack ({selectedDomains.length})
          </button>
        </div>
      </div>
    </dialog>
  );
}
