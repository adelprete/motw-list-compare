import * as cheerio from "cheerio";
import {
  lists,
  LETTERBOXD_PAGE_SIZE,
  MAX_MOVIES_PER_LIST,
  MAX_PAST_WINNERS,
  PAST_MOTW_WINNERS_URL,
} from "./lists-config";
import type { ListData, Movie, MoviesData } from "./types";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function buildPosterUrl(filmId: string, slug: string): string {
  const posterSlug = slug.replace(/-\d{4}$/, "");
  const digitPath = filmId.split("").join("/");
  return `https://a.ltrbxd.com/resized/film-poster/${digitPath}/${filmId}-${posterSlug}-0-230-0-345-crop.jpg`;
}

function parseMoviesFromHtml(html: string): Movie[] {
  const $ = cheerio.load(html);
  const movies: Movie[] = [];
  const seen = new Set<string>();

  $('div.react-component[data-component-class="LazyPoster"]').each((_, el) => {
    const $el = $(el);
    const slug = $el.attr("data-item-slug");
    const name =
      $el.attr("data-item-name") || $el.attr("data-item-full-display-name");
    const identifierRaw = $el.attr("data-postered-identifier");

    if (!slug || !identifierRaw || seen.has(slug)) return;

    let filmId: string | undefined;
    try {
      const identifier = JSON.parse(identifierRaw) as { uid?: string };
      filmId = identifier.uid?.replace(/^film:/, "");
    } catch {
      return;
    }

    if (!filmId) return;

    seen.add(slug);
    movies.push({
      title: (name ?? slug).replace(/\s*\(\d{4}\)\s*$/, "").trim(),
      slug,
      posterUrl: buildPosterUrl(filmId, slug),
    });
  });

  return movies;
}

const FETCH_TIMEOUT_MS = 15_000;

async function fetchPage(url: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error(`Timed out fetching ${url} after ${FETCH_TIMEOUT_MS}ms`);
    }
    throw error;
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
    );
  }

  return response.text();
}

function pageUrl(baseUrl: string, page: number): string {
  const normalized = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return page <= 1 ? normalized : `${normalized}page/${page}/`;
}

async function scrapeListMovies(
  url: string,
  maxMovies: number,
): Promise<Movie[]> {
  const movies: Movie[] = [];
  const seen = new Set<string>();
  const maxPages = Math.ceil(maxMovies / LETTERBOXD_PAGE_SIZE);
  let page = 1;

  while (movies.length < maxMovies && page <= maxPages) {
    const pageMovies = parseMoviesFromHtml(
      await fetchPage(pageUrl(url, page)),
    );

    if (pageMovies.length === 0) break;

    for (const movie of pageMovies) {
      if (movies.length >= maxMovies) break;
      if (seen.has(movie.slug)) continue;
      seen.add(movie.slug);
      movies.push(movie);
    }

    if (pageMovies.length < LETTERBOXD_PAGE_SIZE) break;
    page += 1;
  }

  return movies;
}

async function scrapeList(username: string, url: string): Promise<ListData> {
  const movies = await scrapeListMovies(url, MAX_MOVIES_PER_LIST);
  return { username, url, movies };
}

async function scrapePastWinnerSlugs(): Promise<string[]> {
  try {
    const movies = await scrapeListMovies(
      PAST_MOTW_WINNERS_URL,
      MAX_PAST_WINNERS,
    );
    return movies.map((movie) => movie.slug);
  } catch (error) {
    console.error("Failed to scrape past MotW winners:", error);
    return [];
  }
}

export async function scrapeAllLists(): Promise<MoviesData> {
  const [listResults, pastWinnerSlugs] = await Promise.all([
    Promise.allSettled(lists.map((list) => scrapeList(list.username, list.url))),
    scrapePastWinnerSlugs(),
  ]);

  const listData: ListData[] = [];
  for (let i = 0; i < listResults.length; i++) {
    const result = listResults[i];
    const config = lists[i];
    if (result.status === "fulfilled") {
      listData.push(result.value);
      continue;
    }
    console.error(
      `Failed to scrape list for ${config.username} (${config.url}):`,
      result.reason,
    );
  }

  if (listData.length === 0) {
    throw new Error("Failed to scrape any Letterboxd lists");
  }

  return {
    scrapedAt: new Date().toISOString(),
    lists: listData,
    pastWinnerSlugs,
  };
}
