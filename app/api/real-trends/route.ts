import { NextResponse } from "next/server";

const RSS_URL =
  "https://trends.google.com/trends/trendingsearches/daily/rss?geo=US";

const FALLBACK_TOPICS = [
  "AI Tools 2026",
  "Passive Income Ideas",
  "ChatGPT Alternatives",
  "Make Money Online",
  "Home Automation",
  "Electric Vehicles",
  "Mental Health Tips",
  "Crypto 2026",
  "Remote Work Tools",
  "Side Hustle Ideas",
];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/** Extract up to 10 trend titles from Google's daily RSS XML. */
function parseRssTitles(xml: string): string[] {
  const topics: string[] = [];

  // Split on <item …> or <item> to isolate each entry; index 0 is the channel header.
  const items = xml.split(/<item[\s>]/i);

  for (let i = 1; i < items.length && topics.length < 10; i++) {
    const block = items[i];

    // Prefer CDATA wrapper: <title><![CDATA[…]]></title>
    const cdata = block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i);
    if (cdata?.[1]?.trim()) {
      topics.push(cdata[1].trim());
      continue;
    }

    // Plain text fallback: <title>…</title>
    const plain = block.match(/<title>([\s\S]*?)<\/title>/i);
    if (plain?.[1]?.trim()) {
      topics.push(plain[1].trim());
    }
  }

  return topics;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  try {
    // Hard 5-second timeout so a slow Google response never blocks the page.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);

    let res: Response;
    try {
      res = await fetch(RSS_URL, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "application/rss+xml, application/xml, text/xml, */*",
          "Cache-Control": "no-cache",
        },
        // Skip Next.js fetch cache so every request is fresh
        cache: "no-store",
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      throw new Error(`Google Trends RSS responded with HTTP ${res.status}`);
    }

    const xml = await res.text();
    const topics = parseRssTitles(xml);

    if (topics.length === 0) {
      throw new Error("RSS parsed successfully but contained no trend titles");
    }

    return NextResponse.json(
      { topics, isFallback: false },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    // Log server-side only — the client will never see an error state.
    console.warn(
      "[real-trends] Using fallback topics —",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { topics: FALLBACK_TOPICS, isFallback: true },
      { headers: CORS_HEADERS }
    );
  }
}
