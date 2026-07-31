"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { compareLists, type ComparedMovie } from "@/lib/compare";
import type { MoviesData } from "@/lib/types";

export default function CompareApp() {
  const [data, setData] = useState<MoviesData | null>(null);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [onlyShared, setOnlyShared] = useState(false);

  const loadLists = useCallback(async (fresh = false) => {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(
        fresh ? "/api/lists?fresh=1" : "/api/lists",
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load lists");
      }

      const moviesData = payload as MoviesData;
      const usernames = moviesData.lists.map((list) => list.username);
      setData(moviesData);
      setSelected((prev) => {
        if (prev.length === 0) return usernames;
        const stillValid = prev.filter((u) => usernames.includes(u));
        return stillValid.length > 0 ? stillValid : usernames;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lists");
    } finally {
      setPending(false);
    }
  }, []);

  useEffect(() => {
    void loadLists(false);
  }, [loadLists]);

  const usernames = useMemo(
    () => data?.lists.map((list) => list.username) ?? [],
    [data],
  );

  const compared = useMemo(() => {
    if (!data) return [];
    const minCount = onlyShared ? 2 : 1;
    return compareLists(data.lists, selected).filter(
      (movie) => movie.count >= minCount,
    );
  }, [data, selected, onlyShared]);

  const loading = pending && !data;
  const refreshing = pending && !!data;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            MOTW List Compare
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Compare Letterboxd watchlists to see which movies appear most often.
            {data?.scrapedAt ? (
              <>
                {" "}
                Data scraped{" "}
                <time dateTime={data.scrapedAt}>
                  {new Date(data.scrapedAt).toLocaleString()}
                </time>
                .
              </>
            ) : null}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadLists(true)}
          disabled={pending}
          className="shrink-0 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {refreshing ? "Refreshing…" : "Refresh lists"}
        </button>
      </header>

      {loading ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={() => void loadLists(true)} />
      ) : data ? (
        <>
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Lists to compare
              </h2>
              <div className="flex gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => setSelected(usernames)}
                  className="rounded-full border border-zinc-300 px-3 py-1 text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  className="rounded-full border border-zinc-300 px-3 py-1 text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {data.lists.map((list) => {
                const isChecked = selected.includes(list.username);
                return (
                  <label
                    key={list.username}
                    className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                      isChecked
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-400 dark:bg-emerald-950 dark:text-emerald-200"
                        : "border-zinc-300 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() =>
                        setSelected((prev) =>
                          prev.includes(list.username)
                            ? prev.filter((u) => u !== list.username)
                            : [...prev, list.username],
                        )
                      }
                      className="accent-emerald-600"
                    />
                    <span>{list.username}</span>
                    <span className="text-xs opacity-70">
                      ({list.movies.length})
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-900">
              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={onlyShared}
                  onChange={(e) => setOnlyShared(e.target.checked)}
                  className="accent-emerald-600"
                />
                Only show movies in 2+ selected lists
              </label>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Showing {compared.length} movie
                {compared.length === 1 ? "" : "s"}
                {selected.length > 0
                  ? ` across ${selected.length} list${selected.length === 1 ? "" : "s"}`
                  : ""}
              </p>
            </div>
          </section>

          {selected.length === 0 ? (
            <p className="text-center text-zinc-500 dark:text-zinc-400">
              Select at least one list to compare.
            </p>
          ) : compared.length === 0 ? (
            <p className="text-center text-zinc-500 dark:text-zinc-400">
              No movies match the current filters.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {compared.map((movie) => (
                <li key={movie.slug}>
                  <MovieCard movie={movie} />
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-zinc-500 dark:text-zinc-400">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-800 dark:border-zinc-700 dark:border-t-zinc-200" />
      <p>Scraping Letterboxd lists…</p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-200 bg-red-50 px-6 py-16 text-center dark:border-red-900 dark:bg-red-950/40">
      <p className="text-red-800 dark:text-red-200">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
      >
        Try again
      </button>
    </div>
  );
}

function MovieCard({ movie }: { movie: ComparedMovie }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <a
      href={`https://letterboxd.com/film/${movie.slug}/`}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
      title={`${movie.title} — in ${movie.inLists.join(", ")}`}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-200 dark:bg-zinc-800">
        {!imgFailed ? (
          <Image
            src={movie.posterUrl}
            alt={movie.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
            className="object-cover transition group-hover:scale-105"
            onError={() => setImgFailed(true)}
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-3 text-center text-sm font-medium text-zinc-600 dark:text-zinc-300">
            {movie.title}
          </div>
        )}

        <span
          className={`absolute right-2 top-2 flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-bold text-white shadow-md ${
            movie.count >= 3
              ? "bg-emerald-600"
              : movie.count === 2
                ? "bg-amber-500"
                : "bg-zinc-700"
          }`}
        >
          {movie.count}
        </span>
      </div>

      <div className="p-2.5">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-100">
          {movie.title}
        </p>
        <p className="mt-1 line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
          {movie.inLists.join(", ")}
        </p>
      </div>
    </a>
  );
}
