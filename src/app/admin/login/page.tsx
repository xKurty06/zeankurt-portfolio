import { redirect } from "next/navigation";
import { signInWithMagicLink } from "@/app/admin/actions";
import SaveButton from "@/components/ui/SaveButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv, isAllowedAdminEmail } from "@/lib/supabase/config";

interface AdminLoginPageProps {
  searchParams: Promise<{
    sent?: string;
    error?: string;
    reason?: string;
  }>;
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (user && isAllowedAdminEmail(user.email)) redirect("/admin");

  return (
    <main className="min-h-dvh bg-[var(--background)] px-4 py-24 text-white">
      <div className="mx-auto max-w-md rounded-3xl border border-[var(--border)] bg-[var(--background-elevated)] p-6 shadow-[0_24px_100px_rgba(0,0,0,0.28)]">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--blue-300)]">
          Admin
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-semibold">
          Portfolio CMS
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)]">
          Sign in with an allowlisted email to manage projects, events,
          certifications, experience, skills, and site copy.
        </p>

        {!hasSupabasePublicEnv() ? (
          <p className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
            Supabase public environment variables are missing.
          </p>
        ) : null}

        {params.sent ? (
          <p className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            Check your email for the login link.
          </p>
        ) : null}

        {params.error ? (
          <p className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            {params.error === "forbidden" ? (
              "This email is not allowlisted for admin access."
            ) : params.error === "callback" ? (
              <>
                Unable to complete sign-in.
                {params.reason ? ` ${params.reason}` : " Please open the magic link in the same browser where you requested it."}
              </>
            ) : (
              "Unable to sign in with the current Supabase configuration."
            )}
          </p>
        ) : null}

        <form action={signInWithMagicLink} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="rounded-2xl border border-[var(--border)] bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[var(--border-strong)]"
              placeholder="you@example.com"
            />
          </label>
          <SaveButton type="submit">Send magic link</SaveButton>
        </form>
      </div>
    </main>
  );
}
