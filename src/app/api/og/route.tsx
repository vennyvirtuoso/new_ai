import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { DOMAIN_MAP } from "@/lib/sources";
import type { DomainId } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = (
    searchParams.get("title") ||
    "Worldwide AI Research, Quantum & Deep-Tech Intelligence"
  ).slice(0, 155);
  const rawSummary = (searchParams.get("summary") || "").trim();
  const summary =
    rawSummary.length > 165
      ? `${rawSummary.slice(0, 162).replace(/\s+\S*$/, "")}...`
      : rawSummary;
  const domainParam = searchParams.get("domain") as DomainId | null;
  const domainMeta =
    domainParam && DOMAIN_MAP[domainParam] ? DOMAIN_MAP[domainParam] : null;
  const source = (
    searchParams.get("source") || "28 Live Research & Tech Feeds"
  ).slice(0, 44);
  const tag = (searchParams.get("tag") || "").slice(0, 28);
  const dateLabel = (
    searchParams.get("date") ||
    new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date())
  ).slice(0, 24);
  const theme = searchParams.get("theme") === "dark" ? "dark" : "light";
  const isLight = theme === "light";
  const isDownload = searchParams.get("download") === "1";

  const accent = domainMeta?.accentColor || (isLight ? "#1a4ed8" : "#60a5fa");
  const badgeLabel = domainMeta?.label || "Front Page Briefing";

  const headlineSize =
    title.length > 110 ? 35 : title.length > 75 ? 41 : summary ? 46 : 54;

  const p = isLight
    ? {
        outerBg: `linear-gradient(135deg, #f3f0e8 0%, #faf9f6 52%, ${accent}18 100%)`,
        cardBg: "#ffffff",
        cardBorder: "#e2ddd2",
        cardShadow: "0 24px 60px rgba(20, 20, 19, 0.08)",
        domainBg: `${accent}14`,
        domainBorder: `${accent}38`,
        domainText: accent,
        tagBg: "#f4f2ec",
        tagBorder: "#e2ddd2",
        tagText: "#4a4a45",
        dateText: "#73726c",
        titleText: "#141413",
        summaryText: "#4a4a45",
        divider: "#ebe7dd",
        monogramBg: "#141413",
        monogramText: "#faf9f6",
        brandText: "#141413",
        subText: "#6f6e68",
        sourceBg: "#f6f4ee",
        sourceBorder: "#e2ddd2",
        sourceLabel: "#73726c",
        sourceValue: "#141413",
      }
    : {
        outerBg: `linear-gradient(135deg, #090b10 0%, #0e1118 55%, ${accent}26 100%)`,
        cardBg: "#141822",
        cardBorder: "#283044",
        cardShadow: "0 28px 70px rgba(0, 0, 0, 0.55)",
        domainBg: `${accent}22`,
        domainBorder: `${accent}55`,
        domainText: "#e5edff",
        tagBg: "#1d2332",
        tagBorder: "#313b52",
        tagText: "#c4c9d4",
        dateText: "#8c95a6",
        titleText: "#f6f5f0",
        summaryText: "#b8c0cf",
        divider: "#242b3c",
        monogramBg: "#f5f4f0",
        monogramText: "#0c0e13",
        brandText: "#f5f4f0",
        subText: "#8c95a6",
        sourceBg: "#1a202e",
        sourceBorder: "#2d364b",
        sourceLabel: "#8c95a6",
        sourceValue: "#f3f4f6",
      };

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: "36px",
          background: p.outerBg,
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Elevated Editorial Inner Card */}
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: p.cardBg,
            border: `1.5px solid ${p.cardBorder}`,
            borderRadius: 24,
            boxShadow: p.cardShadow,
            padding: "42px 50px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Sleek top accent ribbon */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 7,
              background: accent,
            }}
          />

          {/* Top Metadata Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: "sans-serif",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "7px 16px",
                  borderRadius: 999,
                  background: p.domainBg,
                  border: `1px solid ${p.domainBorder}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: accent,
                  }}
                />
                <span
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: p.domainText,
                  }}
                >
                  {badgeLabel}
                </span>
              </div>

              {tag ? (
                <div
                  style={{
                    display: "flex",
                    fontSize: 16,
                    fontWeight: 600,
                    padding: "7px 15px",
                    borderRadius: 999,
                    background: p.tagBg,
                    border: `1px solid ${p.tagBorder}`,
                    color: p.tagText,
                  }}
                >
                  {tag}
                </div>
              ) : null}
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: p.dateText,
              }}
            >
              {dateLabel}
            </div>
          </div>

          {/* Centerpiece Headline + Editorial Excerpt */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              marginTop: 10,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: headlineSize,
                fontWeight: 700,
                lineHeight: 1.18,
                letterSpacing: "-0.025em",
                color: p.titleText,
              }}
            >
              {title}
            </div>

            {summary ? (
              <div
                style={{
                  display: "flex",
                  fontFamily: "sans-serif",
                  fontSize: 21,
                  lineHeight: 1.48,
                  color: p.summaryText,
                }}
              >
                {summary}
              </div>
            ) : null}
          </div>

          {/* Bottom Masthead & Source Attribution */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: `1px solid ${p.divider}`,
              paddingTop: 22,
              fontFamily: "sans-serif",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: p.monogramBg,
                  color: p.monogramText,
                  fontFamily: "Georgia, serif",
                  fontSize: 23,
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                }}
              >
                FB
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    fontFamily: "Georgia, serif",
                    color: p.brandText,
                  }}
                >
                  Frontier Brief
                </span>
                <span style={{ fontSize: 15, color: p.subText }}>
                  AI Research · Major Labs · Quantum · Chips &amp; Startups
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                borderRadius: 12,
                background: p.sourceBg,
                border: `1px solid ${p.sourceBorder}`,
                fontSize: 17,
              }}
            >
              <span style={{ color: p.sourceLabel }}>Source</span>
              <span style={{ fontWeight: 700, color: p.sourceValue }}>
                {source}
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: isDownload
        ? {
            "Content-Disposition":
              'attachment; filename="frontier-brief-card.png"',
          }
        : undefined,
    }
  );
}
