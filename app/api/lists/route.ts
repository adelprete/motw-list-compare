import { unstable_cache } from "next/cache";
import { scrapeAllLists } from "@/lib/scrape";

export const runtime = "nodejs";

const CACHE_SECONDS = 60 * 5;

const getCachedLists = unstable_cache(
  async () => scrapeAllLists(),
  ["letterboxd-lists"],
  { revalidate: CACHE_SECONDS },
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fresh = searchParams.get("fresh") === "1";

  try {
    const data = fresh ? await scrapeAllLists() : await getCachedLists();

    return Response.json(data, {
      headers: {
        "Cache-Control": fresh
          ? "no-store"
          : `s-maxage=${CACHE_SECONDS}, stale-while-revalidate=60`,
      },
    });
  } catch (error) {
    console.error("Failed to scrape Letterboxd lists:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to scrape Letterboxd lists",
      },
      { status: 502 },
    );
  }
}
