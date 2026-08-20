import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // When environment variables are not yet provided in .env.local,
    // we use a placeholder client that is gracefully intercepted by the auth context.
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
