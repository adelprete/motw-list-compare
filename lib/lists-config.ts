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

/** Past MotW winners — used to de-emphasize already-won titles in the compare UI. */
export const PAST_MOTW_WINNERS_URL =
  "https://letterboxd.com/disruptr/list/the-lots-motw/";

/** Cap of movies kept per nomination list. */
export const MAX_MOVIES_PER_LIST = 100;

/** Cap when scraping the past-winners archive (multi-page). */
export const MAX_PAST_WINNERS = 1000;

/** Letterboxd list grid page size. */
export const LETTERBOXD_PAGE_SIZE = 100;
