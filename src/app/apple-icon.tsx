import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#141413",
          color: "#faf9f6",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: "-0.04em",
          }}
        >
          FB
        </div>
        <div
          style={{
            marginTop: 10,
            width: 68,
            height: 6,
            borderRadius: 3,
            background: "#3b82f6",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
