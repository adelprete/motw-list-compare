export interface ListConfig {
  username: string;
  url: string;
}

export const lists: ListConfig[] = [
  {
    username: "ShogunDynamite",
    url: "https://letterboxd.com/shogundynamite/list/the-lot-motw/",
  },
  {
    username: "elite",
    url: "https://letterboxd.com/elite_mu/list/lot-watchlist/",
  },
  {
    username: "kneeeel",
    url: "https://letterboxd.com/kneeeel/list/motw-watchlist/",
  },
];

/** Cap of movies kept per list. */
export const MAX_MOVIES_PER_LIST = 100;

/** Letterboxd list grid page size. */
export const LETTERBOXD_PAGE_SIZE = 100;
