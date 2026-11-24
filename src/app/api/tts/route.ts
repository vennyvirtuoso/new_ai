import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const text = request.nextUrl.searchParams.get("text")?.trim();
  const voiceParam = request.nextUrl.searchParams.get("voice") || "fable";

  const openAiKey = process.env.OPENAI_API_KEY;
  const elevenKey = process.env.ELEVENLABS_API_KEY;

  // Health/capability check when called without text
  if (!text) {
    return NextResponse.json({
      studioAvailable: Boolean(openAiKey || elevenKey),
      provider: openAiKey ? "openai" : elevenKey ? "elevenlabs" : "browser",
    });
  }

  const clipped = text.slice(0, 900);

  if (openAiKey) {
    try {
      const allowedVoices = new Set([
        "alloy",
        "ash",
        "coral",
        "echo",
        "fable",
        "nova",
        "onyx",
        "sage",
        "shimmer",
      ]);
      const voice = allowedVoices.has(voiceParam) ? voiceParam : "nova";

      const res = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          voice,
          input: clipped,
          response_format: "mp3",
        }),
      });

      if (res.ok) {
        const audioBuffer = await res.arrayBuffer();
        return new NextResponse(audioBuffer, {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
          },
        });
      }
    } catch {
      // Fall through to browser fallback
    }
  }

  if (elevenKey) {
    try {
      const voiceId =
        process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Rachel
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": elevenKey,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text: clipped,
            model_id: "eleven_turbo_v2_5",
          }),
        }
      );

      if (res.ok) {
        const audioBuffer = await res.arrayBuffer();
        return new NextResponse(audioBuffer, {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
          },
        });
      }
    } catch {
      // Fall through
    }
  }

  return new NextResponse(null, { status: 204 });
}
