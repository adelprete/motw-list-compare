import { revalidateTag, unstable_cache } from "next/cache";
import { lists } from "@/lib/lists-config";
import { scrapeAllLists } from "@/lib/scrape";

export const runtime = "nodejs";

const CACHE_SECONDS = 60 * 5;
const LISTS_TAG = "letterboxd-lists";

/** Bust Data Cache when the configured lists change (survives deploys). */
const listsFingerprint = lists
  .map((list) => `${list.username}:${list.url}`)
  .join("|");

const getCachedLists = unstable_cache(
  async () => scrapeAllLists(),
  ["letterboxd-lists", listsFingerprint],
  { revalidate: CACHE_SECONDS, tags: [LISTS_TAG] },
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fresh = searchParams.get("fresh") === "1";

  try {
    if (fresh) {
      // Expire immediately so the next normal page load does not keep
      // serving the pre-refresh Data Cache entry.
      revalidateTag(LISTS_TAG, { expire: 0 });
    }

    const data = fresh ? await scrapeAllLists() : await getCachedLists();

    return Response.json(data, {
      headers: {
        // Keep caching in unstable_cache only — edge s-maxage made
        // Refresh appear to work while page reloads stayed stale.
        "Cache-Control": "no-store",
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
