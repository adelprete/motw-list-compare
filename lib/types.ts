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
}
