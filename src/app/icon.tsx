import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: "20%",
        }}
      >
        <div
          style={{
            fontSize: 270,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: "-0.04em",
          }}
        >
          FB
        </div>
        <div
          style={{
            marginTop: 18,
            width: 180,
            height: 12,
            borderRadius: 6,
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
