import type { ListData, Movie } from "./types";

export interface ComparedMovie extends Movie {
  count: number;
  inLists: string[];
}

export function compareLists(
  lists: ListData[],
  selectedUsernames: string[],
): ComparedMovie[] {
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
        });
      }
    }
  }

  return Array.from(bySlug.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.title.localeCompare(b.title);
  });
}
