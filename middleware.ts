import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl, isAllowedAdminEmail } from "@/lib/supabase/config";

export async function middleware(request: NextRequest) {
    const supabaseUrl = getSupabaseUrl();
    const supabaseKey = getSupabaseAnonKey();
    const pathname = request.nextUrl.pathname;
    const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin/login";
    if (!supabaseUrl || !supabaseKey) {
        if (isAdminRoute) {
            return withSecurityHeaders(NextResponse.redirect(new URL("/admin/login?error=env", request.url)));
        }
        return withSecurityHeaders(NextResponse.next());
    }

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

    if (isAdminRoute) {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            const redirectUrl = request.nextUrl.clone();
            redirectUrl.pathname = "/admin/login";
            redirectUrl.search = "";
            return withSecurityHeaders(NextResponse.redirect(redirectUrl));
        }

        if (!isAllowedAdminEmail(user.email)) {
            const redirectUrl = request.nextUrl.clone();
            redirectUrl.pathname = "/admin/login";
            redirectUrl.search = "?error=forbidden";
            return withSecurityHeaders(NextResponse.redirect(redirectUrl));
        }
    }

    return withSecurityHeaders(response);
}

function withSecurityHeaders(response: NextResponse) {
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    response.headers.set("Content-Security-Policy", "default-src 'self'; img-src 'self' https: data: blob:; media-src 'self' https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com; connect-src 'self' https://*.supabase.co https://vitals.vercel-insights.com; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    if (process.env.NODE_ENV === "production") {
        response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    return response;
}

export const config = {
    matcher: "/:path*",
};
