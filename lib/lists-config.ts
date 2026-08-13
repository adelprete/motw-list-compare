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
  {
    username: "baxter",
    url: "https://letterboxd.com/claviclepatella/list/rogybot-motw/",
  },
  {
    username: "zuzu",
    url: "https://letterboxd.com/zuzulove/list/zuzus-motw-watchlist/",
  },
  {
    username: "north",
    url: "https://letterboxd.com/NorthWitchHouse/list/thelotmotw/",
  },
  {
    username: "wynter",
    url: "https://letterboxd.com/wynterineden/list/motw-watchlist/",
  },
  {
    username: "Lucas",
    url: "https://letterboxd.com/lucasthor/list/motw-watchlist-list/",
  },
  {
    username: "Faeryn",
    url: "https://letterboxd.com/faerynchan/list/motw-lot/",
  },
  {
    username: "cadrina",
    url: "https://letterboxd.com/cadrina/list/motw-watchlist/",
  },
  {
    username: "marylin",
    url: "https://letterboxd.com/madeupclub/list/lot-film-of-the-week-watchlist/",
  },
  {
    username: "yvonne",
    url: "https://letterboxd.com/yvonnebees/list/yvonne-motw-the-lot/",
  },
  {
    username: "Kneg",
    url: "https://letterboxd.com/knegoff/list/motw/",
  },
  {
    username: "Lasker",
    url: "https://letterboxd.com/lasker_/list/lot-motw-watchlist-1/",
  },
  {
    username: "rae",
    url: "https://letterboxd.com/ariska/list/watchlist/",
  },
  {
    username: "swodder",
    url: "https://letterboxd.com/swodder/list/motw-watchlist/",
  },
  {
    username: "disruptr",
    url: "https://letterboxd.com/disruptr/list/motw-wl-1/",
  },
  {
    username: "molliebae",
    url: "https://letterboxd.com/molliecule/list/the-lot-motw/",
  },
  {
    username: "anar",
    url: "https://letterboxd.com/tomoritomo/list/motw-watchlist-1/",
  },
];

/** Past MotW winners — used to de-emphasize already-won titles in the compare UI. */
export const PAST_MOTW_WINNERS_URL =
  "https://letterboxd.com/disruptr/list/the-lots-motw/";

/** Official Letterboxd Top 500 narrative features by average rating. */
export const LETTERBOXD_TOP_500_URL =
  "https://letterboxd.com/official/list/letterboxds-top-500-films/";

/** Cap of movies kept per nomination list. */
export const MAX_MOVIES_PER_LIST = 100;

/** Cap when scraping the past-winners archive (multi-page). */
export const MAX_PAST_WINNERS = 1000;

/** Cap when scraping Letterboxd's Top 500 (5 pages). */
export const MAX_TOP_500 = 500;

/** Letterboxd list grid page size. */
export const LETTERBOXD_PAGE_SIZE = 100;
