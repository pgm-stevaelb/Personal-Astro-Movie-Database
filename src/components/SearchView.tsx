import * as React from "react";
import { searchTmdb, type TmdbSearchItem, type TmdbType } from "../lib/tmdb";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";

const EMPTY_POSTER = "https://via.placeholder.com/300x450?text=No+Poster";

export default function SearchView() {
  const [query, setQuery] = React.useState("");
  const [type, setType] = React.useState<"movie" | "tv" | "all">("all");
  const [results, setResults] = React.useState<TmdbSearchItem[]>([]);
  const [status, setStatus] = React.useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setStatus("idle");
      setError(null);
      return;
    }

    const handle = window.setTimeout(async () => {
      try {
        setStatus("loading");
        const data = await searchTmdb(query.trim(), type === "all" ? undefined : (type as TmdbType));
        setResults(data.results ?? []);
        setError(null);
        setStatus("idle");
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Search failed");
      }
    }, 300);

    return () => window.clearTimeout(handle);
  }, [query, type]);

  return (
    <section className="space-y-6">
      <Card className="glass">
        <CardHeader>
          <CardTitle>Find your next watch</CardTitle>
          <CardDescription>Search TMDB and save titles into your library.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr,160px,auto]">
            <Input
              placeholder="Search for a title…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Select value={type} onValueChange={(value) => setType(value as "movie" | "tv" | "all")}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="movie">Movies</SelectItem>
                <SelectItem value="tv">Series</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="secondary" onClick={() => setQuery((prev) => prev.trim())}>
              Search
            </Button>
          </div>
          {status === "loading" && <p className="text-sm text-muted-foreground">Searching…</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((item) => (
          <a key={item.tmdbKey} href={`/title/${item.tmdbKey}`} className="group">
            <Card className="h-full transition hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="flex gap-4 pt-6">
                <img
                  src={item.poster ?? EMPTY_POSTER}
                  alt={item.title}
                  className="h-28 w-20 rounded-md object-cover"
                  loading="lazy"
                />
                <div className="space-y-2">
                  <div>
                    <h3 className="text-base font-semibold group-hover:text-primary">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.year ?? ""}</p>
                  </div>
                  <Badge variant="outline">{item.type === "tv" ? "series" : item.type}</Badge>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </section>
  );
}
