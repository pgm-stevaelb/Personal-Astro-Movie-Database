export type TmdbType = "movie" | "tv";

export type TmdbSearchItem = {
  id: number;
  type: TmdbType;
  title: string;
  year: string | null;
  poster: string | null;
  backdrop: string | null;
  rating: number | null;
  tmdbKey: string;
};

export type TmdbSearchResponse = {
  results: TmdbSearchItem[];
  totalResults: number;
};

export type TmdbTitle = {
  id: number;
  type: TmdbType;
  title: string;
  year: string | null;
  overview: string | null;
  runtime: number | null;
  genres: string[];
  poster: string | null;
  backdrop: string | null;
  rating: number | null;
  seasons?: number | null;
  episodes?: number | null;
  raw: Record<string, unknown>;
};

export async function searchTmdb(query: string, type?: TmdbType) {
  const params = new URLSearchParams();
  params.set("q", query);
  if (type) params.set("type", type);
  const res = await fetch(`/api/tmdb/search.json?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Search failed");
  }
  const data = (await res.json()) as TmdbSearchResponse;
  return data;
}

export async function fetchTmdbTitle(tmdbKey: string) {
  const res = await fetch(`/api/tmdb/title/${encodeURIComponent(tmdbKey)}.json`);
  if (!res.ok) {
    throw new Error("Title lookup failed");
  }
  const data = (await res.json()) as TmdbTitle;
  return data;
}
