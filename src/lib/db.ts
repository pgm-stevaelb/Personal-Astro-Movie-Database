import { supabase } from "./supabase/client";
import type { TmdbTitle, TmdbType } from "./tmdb";

export type LibraryStatus = "planned" | "watching" | "completed" | "dropped";

export type TitleRecord = {
  id: string;
  tmdb_id: string;
  type: TmdbType;
  title: string;
  year: string | null;
  poster: string | null;
  data: Record<string, unknown>;
};

export type UserTitleRecord = {
  id: string;
  user_id: string;
  title_id: string;
  status: LibraryStatus;
  progress: number | null;
  rating: number | null;
  notes: string | null;
  updated_at: string;
  title?: TitleRecord;
};

export async function ensureProfile(userId: string, email?: string | null) {
  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    email
  });
  if (error) throw error;
}

export async function upsertTitleFromTmdb(data: TmdbTitle) {
  const payload = {
    tmdb_id: String(data.id),
    type: data.type,
    title: data.title,
    year: data.year ?? null,
    poster: data.poster ?? null,
    data: data.raw ?? data
  };

  const { data: saved, error } = await supabase
    .from("titles")
    .upsert(payload, { onConflict: "tmdb_id" })
    .select("id")
    .single();

  if (error) throw error;
  return saved.id as string;
}

export async function addToLibrary(userId: string, tmdb: TmdbTitle) {
  const titleId = await upsertTitleFromTmdb(tmdb);
  const { data, error } = await supabase
    .from("user_titles")
    .upsert({
      user_id: userId,
      title_id: titleId,
      status: "planned",
      progress: 0
    }, { onConflict: "user_id,title_id" })
    .select("id, status, progress, rating, notes")
    .single();

  if (error) throw error;
  return data;
}

export async function getUserTitleByTmdb(userId: string, tmdbId: string) {
  const { data, error } = await supabase
    .from("user_titles")
    .select("id, status, progress, rating, notes, updated_at, title:titles(id, tmdb_id, type, title, year, poster, data)")
    .eq("user_id", userId)
    .eq("titles.tmdb_id", tmdbId)
    .maybeSingle();

  if (error) throw error;
  return data as UserTitleRecord | null;
}

export async function fetchLibrary(userId: string, status?: LibraryStatus) {
  let query = supabase
    .from("user_titles")
    .select("id, status, progress, rating, notes, updated_at, title:titles(id, tmdb_id, type, title, year, poster, data)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as UserTitleRecord[];
}

export async function updateUserTitle(
  id: string,
  updates: Partial<Pick<UserTitleRecord, "status" | "progress" | "rating" | "notes">>
) {
  const { data, error } = await supabase
    .from("user_titles")
    .update(updates)
    .eq("id", id)
    .select("id, status, progress, rating, notes, updated_at")
    .single();

  if (error) throw error;
  return data as UserTitleRecord;
}

export async function removeUserTitle(id: string) {
  const { error } = await supabase.from("user_titles").delete().eq("id", id);
  if (error) throw error;
}
