import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

export function middleware(request: NextRequest) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.next();
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
        return NextResponse.next();
    }

    return createSupabaseMiddlewareClient(request);
}

export const config = {
    matcher: "/:path*",
};
