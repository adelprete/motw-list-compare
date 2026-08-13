import type { ListData, Movie } from "./types";
import { criterionSlugSet } from "./criterion-slugs";

export interface ComparedMovie extends Movie {
  count: number;
  inLists: string[];
  alreadyWon: boolean;
  isCriterion: boolean;
  isTop500: boolean;
}

export function compareLists(
  lists: ListData[],
  selectedUsernames: string[],
  pastWinnerSlugs: Iterable<string> = [],
  top500Slugs: Iterable<string> = [],
): ComparedMovie[] {
  const winners = new Set(pastWinnerSlugs);
  const top500 = new Set(top500Slugs);
  const selected = lists.filter((list) =>
    selectedUsernames.includes(list.username),
  );

  const bySlug = new Map<string, ComparedMovie>();

  for (const list of selected) {
    for (const movie of list.movies) {
      const existing = bySlug.get(movie.slug);
      if (existing) {
        existing.count += 1;
        existing.inLists.push(list.username);
      } else {
        bySlug.set(movie.slug, {
          ...movie,
          count: 1,
          inLists: [list.username],
          alreadyWon: winners.has(movie.slug),
          isCriterion: criterionSlugSet.has(movie.slug),
          isTop500: top500.has(movie.slug),
        });
      }
    }
  }

  return Array.from(bySlug.values()).sort((a, b) => {
    // Past winners sort after eligible nominees.
    if (a.alreadyWon !== b.alreadyWon) return a.alreadyWon ? 1 : -1;
    if (b.count !== a.count) return b.count - a.count;
    return a.title.localeCompare(b.title);
  });
}
