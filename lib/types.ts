export interface Movie {
  title: string;
  slug: string;
  posterUrl: string;
}

export interface ListData {
  username: string;
  url: string;
  movies: Movie[];
}

export interface MoviesData {
  scrapedAt: string;
  lists: ListData[];
  /** Letterboxd slugs of past MotW winners. */
  pastWinnerSlugs: string[];
  /** Letterboxd slugs from the official Top 500 narrative films list. */
  top500Slugs: string[];
}
