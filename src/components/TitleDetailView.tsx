import * as React from "react";
import { toast } from "sonner";
import { fetchTmdbTitle, type TmdbTitle } from "../lib/tmdb";
import { addToLibrary, getUserTitleByTmdb, removeUserTitle, updateUserTitle } from "../lib/db";
import { useSession } from "../lib/session";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";

const EMPTY_POSTER = "https://via.placeholder.com/300x450?text=No+Poster";

export default function TitleDetailView({ tmdbKey }: { tmdbKey: string }) {
  const { user } = useSession();
  const [title, setTitle] = React.useState<TmdbTitle | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [libraryId, setLibraryId] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<"planned" | "watching" | "completed" | "dropped">("planned");
  const [progress, setProgress] = React.useState(0);
  const [rating, setRating] = React.useState<number | null>(null);
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchTmdbTitle(tmdbKey);
        if (mounted) {
          setTitle(data);
          setError(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load title");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [tmdbKey]);

  React.useEffect(() => {
    if (!user || !title) {
      setLibraryId(null);
      return;
    }
    getUserTitleByTmdb(user.id, String(title.id))
      .then((item) => {
        if (!item) return;
        setLibraryId(item.id);
        setStatus(item.status);
        setProgress(item.progress ?? 0);
        setRating(item.rating ?? null);
        setNotes(item.notes ?? "");
      })
      .catch((err) => console.error(err));
  }, [user, title]);

  const handleAdd = async () => {
    if (!user || !title) {
      toast.error("Sign in to save titles.");
      return;
    }
    setSaving(true);
    try {
      const data = await addToLibrary(user.id, title);
      setLibraryId(data.id);
      toast.success("Added to your library");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!libraryId) return;
    setSaving(true);
    try {
      await updateUserTitle(libraryId, {
        status,
        progress,
        rating: rating ?? null,
        notes
      });
      toast.success("Updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!libraryId) return;
    setSaving(true);
    try {
      await removeUserTitle(libraryId);
      setLibraryId(null);
      toast.success("Removed from library");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading title…</p>;
  }

  if (error || !title) {
    return <p className="text-sm text-destructive">{error ?? "Title not found"}</p>;
  }

  return (
    <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="glass">
        <CardContent className="grid gap-6 pt-6 md:grid-cols-[240px_1fr]">
          <img
            src={title.poster ?? EMPTY_POSTER}
            alt={title.title}
            className="h-72 w-full rounded-xl object-cover"
          />
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-2xl font-semibold">{title.title}</h3>
                <Badge variant="secondary">{title.type === "tv" ? "series" : title.type}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {title.year ?? ""}
                {title.runtime ? ` · ${title.runtime} min` : ""}
                {title.seasons ? ` · ${title.seasons} seasons` : ""}
              </p>
            </div>
            <p className="text-sm leading-relaxed">{title.overview ?? "No overview available."}</p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {title.genres.map((genre, index) => (
                <span key={`${genre}-${index}`}>{genre}</span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>My library</CardTitle>
          <CardDescription>Save this title and track your progress.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!libraryId ? (
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? "Saving…" : "Add to Library"}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3">
                <label className="text-xs text-muted-foreground">Status</label>
                <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="watching">Watching</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="dropped">Dropped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3">
                <label className="text-xs text-muted-foreground">
                  {title.type === "tv" ? "Progress (episodes watched)" : "Progress (0 or 1)"}
                </label>
                <Input
                  type="number"
                  min={0}
                  value={progress}
                  onChange={(event) => setProgress(Number(event.target.value))}
                />
              </div>
              <div className="grid gap-3">
                <label className="text-xs text-muted-foreground">Rating (1-10)</label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={rating ?? ""}
                  onChange={(event) => setRating(event.target.value ? Number(event.target.value) : null)}
                />
              </div>
              <div className="grid gap-3">
                <label className="text-xs text-muted-foreground">Notes</label>
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Thoughts, favorite episode, etc."
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleUpdate} disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
                <Button variant="destructive" onClick={handleRemove} disabled={saving}>
                  Remove
                </Button>
              </div>
            </div>
          )}
          {!user && <p className="text-xs text-muted-foreground">Sign in to track this title.</p>}
        </CardContent>
      </Card>
    </section>
  );
}
