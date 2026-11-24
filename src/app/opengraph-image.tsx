import { ImageResponse } from "next/og";

export const alt = "Frontier Brief — Worldwide AI Research & Deep-Tech Intelligence";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
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
          padding: "60px 68px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontFamily: "sans-serif",
            fontSize: 20,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#34d399",
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: "#34d399",
            }}
          />
          <span>28 LIVE GLOBAL RESEARCH &amp; TECH FEEDS</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              color: "#ffffff",
            }}
          >
            Frontier Brief
          </div>
          <div
            style={{
              fontSize: 30,
              fontFamily: "sans-serif",
              color: "#a8b0be",
              lineHeight: 1.4,
            }}
          >
            Worldwide AI/ML research, major labs, quantum physics, chips &amp;
            energy, and deep-tech entrepreneurship — organized for daily reading.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 14,
            fontFamily: "sans-serif",
            fontSize: 19,
            color: "#e5e7eb",
          }}
        >
          {[
            "AI Research",
            "Major Labs",
            "Quantum",
            "Chips & Energy",
            "Startups & VC",
            "Worldwide Wire",
          ].map((label) => (
            <div
              key={label}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                background: "#1b1f27",
                border: "1px solid #353c4b",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
