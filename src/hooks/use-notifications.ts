import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  type AppNotification,
  fetchNotifications,
  markAllRead,
  markRead,
  syncInsuranceNotifications,
} from "@/lib/notifications";

let insuranceSynced = false;

export function useNotifications(pollMs = 60_000) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setItems([]);
      setLoading(false);
      return;
    }
    if (!insuranceSynced) {
      insuranceSynced = true;
      await syncInsuranceNotifications();
    }
    setItems(await fetchNotifications());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), pollMs);
    return () => clearInterval(t);
  }, [load, pollMs]);

  const unread = items.filter((n) => !n.is_read).length;

  const readOne = useCallback(async (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)),
    );
    await markRead([id]);
  }, []);

  const readAll = useCallback(async () => {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.is_read ? n : { ...n, is_read: true, read_at: now })));
    await markAllRead();
  }, []);

  return { items, unread, loading, reload: load, readOne, readAll };
}
