import { NextRequest, NextResponse } from "next/server";
import { fetchAllNews } from "@/lib/feeds";
import { DOMAINS } from "@/lib/sources";
import type { DomainId } from "@/lib/types";

export const revalidate = 900; // 15 minutes ISR

const VALID_DOMAINS = new Set<string>(DOMAINS.map((d) => d.id));

export async function GET(request: NextRequest) {
  const domainParam = request.nextUrl.searchParams.get("domain");
  const domainFilter =
    domainParam && VALID_DOMAINS.has(domainParam)
      ? (domainParam as DomainId)
      : undefined;

  try {
    const payload = await fetchAllNews(domainFilter);
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
      },
    });
  } catch (error) {
    console.error("Failed to fetch news feeds:", error);
    return NextResponse.json(
      { error: "Unable to aggregate live news feeds right now." },
      { status: 500 }
    );
  }
}
