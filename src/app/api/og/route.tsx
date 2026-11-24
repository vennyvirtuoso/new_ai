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
  const source = (
    searchParams.get("source") || "28 Live Research & Tech Feeds"
  ).slice(0, 50);
  const tag = (searchParams.get("tag") || "").slice(0, 32);
  const theme = searchParams.get("theme") === "light" ? "light" : "dark";
  const isLight = theme === "light";

  const accent = domainMeta?.accentColor || (isLight ? "#1a4ed8" : "#60a5fa");
  const badgeLabel = domainMeta?.label || "FRONT PAGE BRIEFING";
  const isDownload = searchParams.get("download") === "1";

  const palette = isLight
    ? {
        bg: "#faf9f6",
        surface: "#ffffff",
        pillBg: "#f1efe9",
        pillBorder: "#dcd6c8",
        pillText: "#1a4ed8",
        eyebrowText: "#4a4a45",
        titleText: "#141413",
        brandText: "#141413",
        subText: "#63625c",
        divider: "#e2ddd2",
        sourceBg: "#ffffff",
        sourceBorder: "#dcd6c8",
        sourceText: "#2c2c28",
      }
    : {
        bg: "#0e1015",
        surface: "#161922",
        pillBg: "#1e2330",
        pillBorder: "#323a4d",
        pillText: "#8cc0ff",
        eyebrowText: "#c2c6d0",
        titleText: "#f5f4f0",
        brandText: "#f5f4f0",
        subText: "#9ca3b5",
        divider: "#282e3d",
        sourceBg: "#161922",
        sourceBorder: "#2f3647",
        sourceText: "#e5e7eb",
      };

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: palette.bg,
          color: palette.titleText,
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
                color: palette.eyebrowText,
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
                background: palette.pillBg,
                border: `1px solid ${palette.pillBorder}`,
                color: palette.pillText,
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
            color: palette.titleText,
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
            borderTop: `1px solid ${palette.divider}`,
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
                color: palette.brandText,
              }}
            >
              Frontier Brief
            </span>
            <span style={{ fontSize: 19, color: palette.subText }}>
              AI Research · Major Labs · Quantum · Chips &amp; Energy · Startups
            </span>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 20,
              color: palette.sourceText,
              padding: "10px 18px",
              borderRadius: 10,
              background: palette.sourceBg,
              border: `1px solid ${palette.sourceBorder}`,
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
