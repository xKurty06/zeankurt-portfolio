import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseAnonKey,
  getSupabaseSecretKey,
  getSupabaseUrl,
  hasSupabaseAdminEnv,
  hasSupabasePublicEnv,
} from "@/lib/supabase/config";

export async function createSupabaseServerClient(
  cookieStore?: Awaited<ReturnType<typeof cookies>>,
) {
  if (!hasSupabasePublicEnv()) return null;

  const resolvedCookieStore = cookieStore ?? (await cookies());

  return createServerClient(
    getSupabaseUrl()!,
    getSupabaseAnonKey()!,
    {
      cookies: {
        getAll() {
          return resolvedCookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              resolvedCookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot always set cookies. Route handlers/actions can.
          }
        },
      },
    },
  );
}

export function createSupabaseAdminClient() {
  if (!hasSupabaseAdminEnv()) return null;

  return createClient(
    getSupabaseUrl()!,
    getSupabaseSecretKey()!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
