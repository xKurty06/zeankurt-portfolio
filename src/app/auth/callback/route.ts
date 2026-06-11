import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/admin";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase?.auth.exchangeCodeForSession(code) ?? {};

    if (error) {
      const errorUrl = new URL(`/admin/login`, url.origin);
      errorUrl.searchParams.set("error", "callback");
      errorUrl.searchParams.set(
        "reason",
        error.message ?? "Unable to complete sign-in.",
      );
      return NextResponse.redirect(errorUrl);
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
