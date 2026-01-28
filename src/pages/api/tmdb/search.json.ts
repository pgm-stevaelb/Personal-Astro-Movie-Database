import type { APIRoute } from "astro";
import { checkRateLimit } from "./_rateLimit";

const TMDB_ENDPOINT = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

export const prerender = false;

export const GET: APIRoute = async ({ request, url, clientAddress }) => {
  const query = url.searchParams.get("q")?.trim();
  const typeParam = url.searchParams.get("type");
  const type = typeParam === "series" ? "tv" : typeParam;
  const apiKey = import.meta.env.TMDB_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "TMDB API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (!query || query.length < 2) {
    return new Response(JSON.stringify({ error: "Query must be at least 2 characters" }), {
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

  let endpoint = "/search/multi";
  if (type === "movie") endpoint = "/search/movie";
  if (type === "tv") endpoint = "/search/tv";

  const tmdbUrl = new URL(`${TMDB_ENDPOINT}${endpoint}`);
  tmdbUrl.searchParams.set("api_key", apiKey);
  tmdbUrl.searchParams.set("query", query);
  tmdbUrl.searchParams.set("include_adult", "false");
  tmdbUrl.searchParams.set("language", "en-US");
  tmdbUrl.searchParams.set("page", "1");

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
  const rawResults = Array.isArray(data?.results) ? data.results : [];

  const normalized = rawResults
    .filter((item: any) => {
      const mediaType = item?.media_type ?? type;
      return mediaType === "movie" || mediaType === "tv";
    })
    .map((item: any) => {
      const mediaType = (item?.media_type ?? type) as "movie" | "tv";
      const title = mediaType === "movie" ? item?.title : item?.name;
      const yearSource = mediaType === "movie" ? item?.release_date : item?.first_air_date;
      const year = typeof yearSource === "string" && yearSource.length >= 4 ? yearSource.slice(0, 4) : null;
      return {
        id: item?.id,
        type: mediaType,
        title: title ?? "",
        year,
        poster: item?.poster_path ? `${IMAGE_BASE}${item.poster_path}` : null,
        backdrop: item?.backdrop_path ? `${IMAGE_BASE}${item.backdrop_path}` : null,
        rating: typeof item?.vote_average === "number" ? item.vote_average : null,
        tmdbKey: `${mediaType}-${item?.id}`
      };
    })
    .filter((item: any) => item.id && item.title);

  return new Response(
    JSON.stringify({
      results: normalized,
      totalResults: Number(data?.total_results ?? normalized.length)
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
