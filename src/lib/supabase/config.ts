export const SUPABASE_BUCKET = "portfolio-assets";
export const PHOTOGRAPHY_BUCKET = process.env.PHOTOGRAPHY_BUCKET || "photography";

const CANONICAL_SITE_URL = "https://zeankurt.vercel.app";
const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");

function isSafeSiteUrl(value?: string) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && !["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname);
  } catch {
    return false;
  }
}

// Never allow a local development URL to leak into production magic links.
export const SITE_URL = isSafeSiteUrl(configuredSiteUrl) ? configuredSiteUrl! : CANONICAL_SITE_URL;

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
