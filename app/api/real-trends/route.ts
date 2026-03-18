import { NextResponse } from "next/server";

// google-trends-api is CJS with no TS types
// eslint-disable-next-line @typescript-eslint/no-require-imports
const googleTrends = require("google-trends-api");

interface TrendingSearch {
  title: { query: string };
  relatedQueries?: { query: string }[];
}

interface TrendingDay {
  trendingSearches: TrendingSearch[];
}

interface DailyTrendsResult {
  default: {
    trendingSearchesDays: TrendingDay[];
  };
}

export async function GET() {
  try {
    const raw: string = await googleTrends.dailyTrends({ geo: "US" });
    const data: DailyTrendsResult = JSON.parse(raw);

    const topics: string[] = data.default.trendingSearchesDays
      .flatMap((day) => day.trendingSearches)
      .map((t) => t.title.query)
      .filter(Boolean)
      .slice(0, 20);

    return NextResponse.json({ topics });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[real-trends]", msg);
    return NextResponse.json(
      { error: "Could not fetch Google Trends", details: msg },
      { status: 502 }
    );
  }
}
