import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl, isAllowedAdminEmail } from "@/lib/supabase/config";

export async function middleware(request: NextRequest) {
    const supabaseUrl = getSupabaseUrl();
    const supabaseKey = getSupabaseAnonKey();
    if (!supabaseUrl || !supabaseKey) return NextResponse.next();

    let response = NextResponse.next({ request });
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => {
                    response.cookies.set(name, value, options);
                });
            },
        },
    });

    await supabase.auth.getClaims();

    const pathname = request.nextUrl.pathname;
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            const redirectUrl = request.nextUrl.clone();
            redirectUrl.pathname = "/admin/login";
            redirectUrl.search = "";
            return NextResponse.redirect(redirectUrl);
        }

        if (!isAllowedAdminEmail(user.email)) {
            const redirectUrl = request.nextUrl.clone();
            redirectUrl.pathname = "/admin/login";
            redirectUrl.search = "?error=forbidden";
            return NextResponse.redirect(redirectUrl);
        }
    }

    return response;
}

export const config = {
    matcher: "/:path*",
};
