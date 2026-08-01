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
  const [highlightUser, setHighlightUser] = useState<string | null>(null);
  const [onlyShared, setOnlyShared] = useState(false);
  const [onlyUnique, setOnlyUnique] = useState(false);

  const loadLists = useCallback(async (fresh = false) => {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(
        fresh ? "/api/lists?fresh=1" : "/api/lists",
        { signal: AbortSignal.timeout(90_000) },
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
      setHighlightUser((prev) =>
        prev && usernames.includes(prev) ? prev : null,
      );
    } catch (err) {
      const message =
        err instanceof Error && err.name === "TimeoutError"
          ? "Timed out waiting for Letterboxd scrape. Try Refresh lists."
          : err instanceof Error
            ? err.message
            : "Failed to load lists";
      setError(message);
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
    return compareLists(
      data.lists,
      selected,
      data.pastWinnerSlugs ?? [],
    ).filter((movie) => {
      if (onlyShared) return movie.count >= 2;
      if (onlyUnique) return movie.count === 1;
      return true;
    });
  }, [data, selected, onlyShared, onlyUnique]);

  const loading = pending && !data;
  const refreshing = pending && !!data;

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-col gap-5 border-b border-divider pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-meta">
            The Lot · Movie of the Week
          </p>
          <h1 className="font-display text-[2rem] font-bold leading-tight tracking-tight text-ink-heading sm:text-[2.25rem]">
            MOTW Lists
          </h1>
          <p className="max-w-xl text-[15px] leading-relaxed text-ink-body">
            See which films show up most often across MotW watchlists from{" "}
            <a
              href="https://discord.gg/4UqEmXXd2p"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link transition hover:text-link-hover"
            >
              The Lot
            </a>
            , a film Discord server.
          </p>
          {data?.scrapedAt ? (
            <p className="text-[13px] text-ink-meta">
              Scraped{" "}
              <time dateTime={data.scrapedAt} className="text-ink-soft">
                {new Date(data.scrapedAt).toLocaleString()}
              </time>
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => void loadLists(true)}
          disabled={pending}
          className="shrink-0 rounded-[3px] bg-green-cta px-4 py-2 text-[13px] font-bold text-ink-heading transition hover:bg-green-hover active:bg-green-active disabled:cursor-not-allowed disabled:opacity-50"
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
          <section className="flex flex-col gap-4">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-ink-heading">
                Included Lists
              </h2>
              <div className="flex gap-3 text-[13px]">
                <button
                  type="button"
                  onClick={() => setSelected(usernames)}
                  className="text-link transition hover:text-link-hover"
                >
                  Select all
                </button>
                <span className="text-divider">·</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelected([]);
                    setHighlightUser(null);
                  }}
                  className="text-link transition hover:text-link-hover"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {data.lists.map((list) => {
                const isChecked = selected.includes(list.username);
                return (
                  <label
                    key={list.username}
                    className={`flex cursor-pointer items-center gap-2 rounded-[3px] px-3 py-1.5 text-[13px] font-medium transition ${
                      isChecked
                        ? "bg-elevated text-ink-heading ring-1 ring-green/70"
                        : "bg-inset text-ink-meta hover:bg-elevated hover:text-ink-soft"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        const removing = selected.includes(list.username);
                        setSelected((prev) =>
                          removing
                            ? prev.filter((u) => u !== list.username)
                            : [...prev, list.username],
                        );
                        if (removing && highlightUser === list.username) {
                          setHighlightUser(null);
                        }
                      }}
                      className="sr-only"
                    />
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        isChecked ? "bg-green" : "bg-ink-meta/50"
                      }`}
                      aria-hidden
                    />
                    <span>{list.username}</span>
                    <span className="text-[11px] text-ink-meta">
                      {list.movies.length}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 border-t border-divider pt-4">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-ink-heading">
                Filters
              </h2>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
                <label className="flex cursor-pointer items-center gap-2 text-ink-soft">
                  <input
                    type="checkbox"
                    checked={onlyShared}
                    onChange={(e) => {
                      setOnlyShared(e.target.checked);
                      if (e.target.checked) setOnlyUnique(false);
                    }}
                    className="size-3.5 rounded-[2px] border-divider accent-green-cta"
                  />
                  Only films in 2+ lists
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-ink-soft">
                  <input
                    type="checkbox"
                    checked={onlyUnique}
                    onChange={(e) => {
                      setOnlyUnique(e.target.checked);
                      if (e.target.checked) setOnlyShared(false);
                    }}
                    className="size-3.5 rounded-[2px] border-divider accent-green-cta"
                  />
                  Only films in 1 list
                </label>
                <label className="flex items-center gap-2 text-ink-soft">
                  <span className="shrink-0">Highlight</span>
                  <select
                    value={highlightUser ?? ""}
                    onChange={(e) => {
                      const username = e.target.value || null;
                      setHighlightUser(username);
                      if (username && !selected.includes(username)) {
                        setSelected((prev) => [...prev, username]);
                      }
                    }}
                    className="rounded-[3px] border border-divider bg-inset px-2 py-1 text-[13px] text-ink-heading outline-none focus:border-green/70"
                  >
                    <option value="">None</option>
                    {data.lists.map((list) => (
                      <option key={list.username} value={list.username}>
                        {list.username}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="text-ink-meta">
                  {compared.length} film{compared.length === 1 ? "" : "s"}
                  {selected.length > 0
                    ? ` · ${selected.length} list${selected.length === 1 ? "" : "s"}`
                    : ""}
                </p>
              </div>
            </div>
          </section>

          {selected.length === 0 ? (
            <p className="py-16 text-center text-ink-meta">
              Select at least one list to compare.
            </p>
          ) : compared.length === 0 ? (
            <p className="py-16 text-center text-ink-meta">
              No films match the current filters.
            </p>
          ) : (
            <ul className="grid grid-cols-4 gap-x-3 gap-y-6 lg:grid-cols-5 xl:grid-cols-6">
              {compared.map((movie) => {
                const isHighlighted =
                  highlightUser !== null &&
                  movie.inLists.includes(highlightUser);
                return (
                  <li key={movie.slug}>
                    <MovieCard
                      movie={movie}
                      highlighted={isHighlighted}
                      dimmed={highlightUser !== null && !isHighlighted}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : null}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-28 text-ink-meta">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-divider border-t-green" />
      <p className="text-[13px]">Loading lists…</p>
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
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <p className="max-w-md text-ink-strong">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-[3px] bg-green-cta px-4 py-2 text-[13px] font-bold text-ink-heading transition hover:bg-green-hover"
      >
        Try again
      </button>
    </div>
  );
}

function MovieCard({
  movie,
  highlighted = false,
  dimmed = false,
}: {
  movie: ComparedMovie;
  highlighted?: boolean;
  dimmed?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const won = movie.alreadyWon;
  const criterion = movie.isCriterion;

  const titleBits = [
    movie.title,
    won ? "already won MotW" : null,
    criterion ? "Criterion Collection" : null,
    highlighted ? "highlighted" : null,
    `in ${movie.inLists.join(", ")}`,
  ].filter(Boolean);

  return (
    <a
      href={`https://letterboxd.com/film/${movie.slug}/`}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block transition ${
        dimmed
          ? "opacity-35 hover:opacity-55"
          : won
            ? "opacity-50 hover:opacity-80"
            : ""
      }`}
      title={titleBits.join(" — ")}
    >
      <div
        className={`relative aspect-[2/3] w-full rounded-[2px] bg-poster-well transition ${
          highlighted
            ? "shadow-[0_0_0_3px_#ff8000,0_0_16px_4px_rgba(255,128,0,0.55)]"
            : won
              ? ""
              : "group-hover:outline group-hover:outline-2 group-hover:outline-offset-[-2px] group-hover:outline-green"
        }`}
      >
        <div className="relative h-full w-full overflow-hidden rounded-[2px]">
          {!imgFailed ? (
            <Image
              src={movie.posterUrl}
              alt={movie.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
              className={`object-cover ${won ? "grayscale" : ""}`}
              onError={() => setImgFailed(true)}
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-inset p-3 text-center text-[13px] font-medium text-ink-soft">
              {movie.title}
            </div>
          )}

          <div className="absolute left-1.5 top-1.5 flex flex-col items-start gap-1">
            {won ? (
              <span className="rounded-[2px] bg-canvas/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-meta">
                Won
              </span>
            ) : null}
            {criterion ? (
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full bg-black shadow-sm"
                aria-label="Criterion Collection"
              >
                <Image
                  src="/criterion-logo.png"
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 object-contain"
                  unoptimized
                />
              </span>
            ) : null}
          </div>

          <span
            className={`absolute bottom-1.5 right-1.5 flex h-6 min-w-6 items-center justify-center rounded-[2px] px-1.5 text-[12px] font-bold text-ink-heading ${
              won
                ? "bg-ink-meta/80"
                : movie.count >= 3
                  ? "bg-green-cta"
                  : movie.count === 2
                    ? "bg-orange"
                    : "bg-canvas/85"
            }`}
          >
            {movie.count}
          </span>
        </div>
      </div>

      <div className="mt-2 px-0.5">
        <p
          className={`line-clamp-2 text-[13px] font-bold leading-snug ${
            dimmed || won
              ? "text-ink-meta"
              : highlighted
                ? "text-orange"
                : "text-link group-hover:text-link-hover"
          }`}
        >
          {movie.title}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-meta">
          {movie.inLists.join(", ")}
        </p>
      </div>
    </a>
  );
}
