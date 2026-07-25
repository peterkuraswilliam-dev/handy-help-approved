// Untyped Supabase accessor. The generated types.ts hasn't yet picked up the
// newly created tables, so we use a loose client for those queries.
// This keeps app code clean while types catch up.
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as any;
