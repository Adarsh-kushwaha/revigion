import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 *
 * Safe to call in Client Components. createBrowserClient is a singleton by
 * default — it returns the same instance on subsequent calls within the same
 * browser session, so this module can be imported freely without worrying
 * about creating duplicate clients.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
