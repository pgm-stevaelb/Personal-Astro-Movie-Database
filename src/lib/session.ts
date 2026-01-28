import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let subscription: { subscription: { unsubscribe: () => void } } | null = null;

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setLoading(false);
      }

      try {
        subscription = supabase.auth.onAuthStateChange((_event, nextSession) => {
          setSession(nextSession);
          setUser(nextSession?.user ?? null);
          setLoading(false);
        });
      } catch (error) {
        console.error(error);
      }
    };

    init();

    return () => {
      active = false;
      subscription?.subscription.unsubscribe();
    };
  }, []);

  return { session, user, loading };
}
