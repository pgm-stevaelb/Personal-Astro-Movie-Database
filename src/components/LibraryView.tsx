import * as React from "react";
import { toast } from "sonner";
import type { LibraryStatus, UserTitleRecord } from "../lib/db";
import { fetchLibrary, removeUserTitle, updateUserTitle } from "../lib/db";
import { useSession } from "../lib/session";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";

const EMPTY_POSTER = "https://via.placeholder.com/300x450?text=No+Poster";

const STATUSES: { label: string; value: LibraryStatus }[] = [
  { label: "Planned", value: "planned" },
  { label: "Watching", value: "watching" },
  { label: "Completed", value: "completed" },
  { label: "Dropped", value: "dropped" }
];

export default function LibraryView() {
  const { user } = useSession();
  const [statusFilter, setStatusFilter] = React.useState<"all" | LibraryStatus>("all");
  const [items, setItems] = React.useState<UserTitleRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<UserTitleRecord | null>(null);
  const [form, setForm] = React.useState({
    status: "planned" as LibraryStatus,
    progress: 0,
    rating: "",
    notes: ""
  });

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchLibrary(user.id, statusFilter === "all" ? undefined : statusFilter);
      setItems(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load library");
    } finally {
      setLoading(false);
    }
  }, [user, statusFilter]);

  React.useEffect(() => {
    load();
  }, [load]);

  const openEditor = (item: UserTitleRecord) => {
    setSelected(item);
    setForm({
      status: item.status,
      progress: item.progress ?? 0,
      rating: item.rating?.toString() ?? "",
      notes: item.notes ?? ""
    });
  };

  const handleSave = async () => {
    if (!selected) return;
    try {
      await updateUserTitle(selected.id, {
        status: form.status,
        progress: Number(form.progress) || 0,
        rating: form.rating ? Number(form.rating) : null,
        notes: form.notes
      });
      toast.success("Updated");
      setSelected(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeUserTitle(id);
      toast.success("Removed");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    }
  };

  if (!user) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle>Sign in to build your library</CardTitle>
          <CardDescription>Your saved titles will appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href="/auth">Go to sign in</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Your Library</h3>
          <p className="text-sm text-muted-foreground">Keep tabs on what you watch next.</p>
        </div>
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | LibraryStatus)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {STATUSES.map((status) => (
              <TabsTrigger key={status.value} value={status.value}>
                {status.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading library…</p>}

      {!loading && items.length === 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle>Nothing yet</CardTitle>
            <CardDescription>Search for a title and add it to your library.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/search">Find titles</a>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.id} className="glass">
            <CardContent className="flex gap-4 pt-6">
              <img
                src={item.title?.poster && item.title.poster !== "N/A" ? item.title.poster : EMPTY_POSTER}
                alt={item.title?.title ?? "Poster"}
                className="h-28 w-20 rounded-md object-cover"
              />
              <div className="flex-1 space-y-2">
                <div>
                  <h4 className="text-base font-semibold">{item.title?.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {item.title?.year} · {item.title?.type === "tv" ? "series" : item.title?.type}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{item.status}</Badge>
                  {item.rating ? <Badge variant="outline">Rating: {item.rating}</Badge> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Dialog
                    open={selected?.id === item.id}
                    onOpenChange={(open) => {
                      if (!open) setSelected(null);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => openEditor(item)}>
                        Edit
                      </Button>
                    </DialogTrigger>
                    {selected?.id === item.id && (
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit {item.title?.title}</DialogTitle>
                          <DialogDescription>Update your progress and notes.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div className="grid gap-2">
                            <label className="text-xs text-muted-foreground">Status</label>
                            <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as LibraryStatus }))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUSES.map((status) => (
                                  <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <label className="text-xs text-muted-foreground">Progress</label>
                            <Input
                              type="number"
                              min={0}
                              value={form.progress}
                              onChange={(event) => setForm((prev) => ({ ...prev, progress: Number(event.target.value) }))}
                            />
                          </div>
                          <div className="grid gap-2">
                            <label className="text-xs text-muted-foreground">Rating (1-10)</label>
                            <Input
                              type="number"
                              min={1}
                              max={10}
                              value={form.rating}
                              onChange={(event) => setForm((prev) => ({ ...prev, rating: event.target.value }))}
                            />
                          </div>
                          <div className="grid gap-2">
                            <label className="text-xs text-muted-foreground">Notes</label>
                            <Textarea
                              value={form.notes}
                              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setSelected(null)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSave}>Save</Button>
                        </DialogFooter>
                      </DialogContent>
                    )}
                  </Dialog>
                  <Button size="sm" variant="destructive" onClick={() => handleRemove(item.id)}>
                    Remove
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <a href={`/title/${item.title?.tmdb_id ? `${item.title.type}-${item.title.tmdb_id}` : ""}`}>Details</a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
