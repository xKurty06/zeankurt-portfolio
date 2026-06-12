export const SUPABASE_BUCKET = "portfolio-assets";
export const PHOTOGRAPHY_BUCKET = process.env.PHOTOGRAPHY_BUCKET || "photography";

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function getSupabaseAnonKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

export function hasSupabasePublicEnv() {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function hasSupabaseAdminEnv() {
  return Boolean(
    getSupabaseUrl() && getSupabaseSecretKey(),
  );
}

export function getSupabaseSecretKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
}

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedAdminEmail(email?: string | null) {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}
