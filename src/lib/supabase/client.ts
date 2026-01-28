import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let supabaseClient: SupabaseClient | null = null;

function getClient() {
  if (supabaseClient) return supabaseClient;
  if (!supabaseUrl || !supabasePublishableKey) {
    if (!import.meta.env.SSR) {
      console.warn("Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
    }
    throw new Error("Supabase environment variables are required.");
  }

  supabaseClient = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  });

  return supabaseClient;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getClient();
    return client[prop as keyof SupabaseClient];
  }
});
