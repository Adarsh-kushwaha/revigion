import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client.
 *
 * Must be called inside a Server Component, Route Handler, or Server Function
 * — never shared across requests. `cookies()` is async in Next.js 15+, so
 * this function is async to match.
 *
 * Uses getAll/setAll (non-deprecated API) for robust session handling.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll is called from a Server Component where response headers
            // cannot be mutated. This is safe to ignore — a middleware client
            // will handle refreshing the session.
          }
        },
      },
    },
  );
}
