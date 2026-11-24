import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { DOMAIN_MAP } from "@/lib/sources";
import type { DomainId } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = (
    searchParams.get("title") ||
    "Worldwide AI Research, Quantum & Deep-Tech Intelligence"
  ).slice(0, 140);
  const domainParam = searchParams.get("domain") as DomainId | null;
  const domainMeta =
    domainParam && DOMAIN_MAP[domainParam] ? DOMAIN_MAP[domainParam] : null;
  const source = (searchParams.get("source") || "28 Live Research & Tech Feeds").slice(
    0,
    50
  );
  const tag = (searchParams.get("tag") || "").slice(0, 32);
  const accent = domainMeta?.accentColor || "#3b82f6";
  const badgeLabel = domainMeta?.label || "FRONT PAGE BRIEFING";
  const isDownload = searchParams.get("download") === "1";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0d0f12",
          color: "#f3f4f6",
          padding: "56px 64px",
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 10,
            background: accent,
          }}
        />

        {/* Eyebrow row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: "sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 14,
                height: 14,
                borderRadius: 999,
                background: accent,
              }}
            />
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#d1d5db",
              }}
            >
              {badgeLabel}
            </span>
          </div>

          {tag ? (
            <div
              style={{
                display: "flex",
                fontSize: 20,
                padding: "8px 18px",
                borderRadius: 999,
                background: "#1b1f27",
                border: "1px solid #353c4b",
                color: "#93c5fd",
              }}
            >
              {tag}
            </div>
          ) : null}
        </div>

        {/* Main Headline */}
        <div
          style={{
            display: "flex",
            fontSize: title.length > 85 ? 48 : 58,
            fontWeight: 700,
            lineHeight: 1.16,
            letterSpacing: "-0.025em",
            color: "#ffffff",
            marginTop: 12,
            marginBottom: 12,
          }}
        >
          {title}
        </div>

        {/* Footer branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #242934",
            paddingTop: 26,
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                fontSize: 30,
                fontWeight: 700,
                fontFamily: "Georgia, serif",
                color: "#ffffff",
              }}
            >
              Frontier Brief
            </span>
            <span style={{ fontSize: 19, color: "#9ca3af" }}>
              AI Research · Major Labs · Quantum · Chips &amp; Energy · Startups
            </span>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 20,
              color: "#d1d5db",
              padding: "10px 18px",
              borderRadius: 10,
              background: "#14171c",
              border: "1px solid #242934",
            }}
          >
            {`Source: ${source}`}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: isDownload
        ? {
            "Content-Disposition": 'attachment; filename="frontier-brief-card.png"',
          }
        : undefined,
    }
  );
}
