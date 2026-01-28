import type { APIRoute } from "astro";
import { checkRateLimit } from "../_rateLimit";

const TMDB_ENDPOINT = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

export const prerender = false;

export const GET: APIRoute = async ({ params, request, clientAddress }) => {
  const tmdbKey = params.tmdbKey?.trim();
  const apiKey = import.meta.env.TMDB_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "TMDB API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (!tmdbKey) {
    return new Response(JSON.stringify({ error: "Missing tmdbKey" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const [type, idValue] = tmdbKey.split("-");
  if ((type !== "movie" && type !== "tv") || !idValue) {
    return new Response(JSON.stringify({ error: "tmdbKey must be formatted as 'movie-123' or 'tv-123'" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const id = Number(idValue);
  if (!Number.isFinite(id)) {
    return new Response(JSON.stringify({ error: "Invalid tmdb id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const rateKey = clientAddress ?? request.headers.get("x-forwarded-for") ?? "unknown";
  const rate = checkRateLimit(rateKey);
  if (!rate.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": Math.ceil((rate.reset - Date.now()) / 1000).toString(),
        "X-RateLimit-Limit": rate.limit.toString(),
        "X-RateLimit-Remaining": rate.remaining.toString(),
        "X-RateLimit-Reset": rate.reset.toString()
      }
    });
  }

  const tmdbUrl = new URL(`${TMDB_ENDPOINT}/${type}/${id}`);
  tmdbUrl.searchParams.set("api_key", apiKey);
  tmdbUrl.searchParams.set("language", "en-US");

  const res = await fetch(tmdbUrl.toString(), {
    headers: { Accept: "application/json" }
  });

  if (!res.ok) {
    return new Response(JSON.stringify({ error: "TMDB request failed" }), {
      status: res.status,
      headers: { "Content-Type": "application/json" }
    });
  }

  const data = await res.json();
  const title = type === "movie" ? data?.title : data?.name;
  const yearSource = type === "movie" ? data?.release_date : data?.first_air_date;
  const year = typeof yearSource === "string" && yearSource.length >= 4 ? yearSource.slice(0, 4) : null;
  const runtime = type === "movie" ? data?.runtime ?? null : Array.isArray(data?.episode_run_time) ? data.episode_run_time[0] ?? null : null;
  const genres = Array.isArray(data?.genres) ? data.genres.map((genre: any) => genre?.name).filter(Boolean) : [];

  return new Response(
    JSON.stringify({
      id,
      type,
      title: title ?? "",
      year,
      overview: data?.overview ?? null,
      runtime,
      genres,
      poster: data?.poster_path ? `${IMAGE_BASE}${data.poster_path}` : null,
      backdrop: data?.backdrop_path ? `${IMAGE_BASE}${data.backdrop_path}` : null,
      rating: typeof data?.vote_average === "number" ? data.vote_average : null,
      seasons: type === "tv" ? data?.number_of_seasons ?? null : null,
      episodes: type === "tv" ? data?.number_of_episodes ?? null : null,
      raw: data ?? {}
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": rate.limit.toString(),
        "X-RateLimit-Remaining": rate.remaining.toString(),
        "X-RateLimit-Reset": rate.reset.toString()
      }
    }
  );
};
