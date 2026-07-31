import * as cheerio from "cheerio";
import {
  lists,
  LETTERBOXD_PAGE_SIZE,
  MAX_MOVIES_PER_LIST,
} from "./lists-config";
import type { ListData, Movie, MoviesData } from "./types";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const MAX_PAGES = Math.ceil(MAX_MOVIES_PER_LIST / LETTERBOXD_PAGE_SIZE);

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

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
    },
    cache: "no-store",
  });

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

async function scrapeList(username: string, url: string): Promise<ListData> {
  const movies: Movie[] = [];
  const seen = new Set<string>();
  let page = 1;

  while (movies.length < MAX_MOVIES_PER_LIST && page <= MAX_PAGES) {
    const pageMovies = parseMoviesFromHtml(
      await fetchPage(pageUrl(url, page)),
    );

    if (pageMovies.length === 0) break;

    for (const movie of pageMovies) {
      if (movies.length >= MAX_MOVIES_PER_LIST) break;
      if (seen.has(movie.slug)) continue;
      seen.add(movie.slug);
      movies.push(movie);
    }

    if (pageMovies.length < LETTERBOXD_PAGE_SIZE) break;
    page += 1;
  }

  return { username, url, movies };
}

export async function scrapeAllLists(): Promise<MoviesData> {
  const listData = await Promise.all(
    lists.map((list) => scrapeList(list.username, list.url)),
  );

  return {
    scrapedAt: new Date().toISOString(),
    lists: listData,
  };
}
