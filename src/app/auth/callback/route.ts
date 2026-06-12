import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function safeNextPath(next: string | null) {
  if (!next) return "/admin";
  if (!next.startsWith("/")) return "/admin";
  if (next.startsWith("//")) return "/admin";
  if (!next.startsWith("/admin")) return "/admin";
  return next;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase?.auth.exchangeCodeForSession(code) ?? {};

    if (error) {
      const errorUrl = new URL(`/admin/login`, url.origin);
      errorUrl.searchParams.set("error", "callback");
      return NextResponse.redirect(errorUrl);
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
