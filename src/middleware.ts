// src/middleware.ts
// Runs before every request to protected routes.
// Verifies the user is authenticated and has permission
// to access the route they're requesting.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { UserRole } from "@/types/types";

// Maps each protected path prefix to the roles allowed to access it
const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
    "/super-admin": ["super_admin"],
    "/instructor": ["instructor"],
    "/student": ["student"],
};

function getRequiredRoles(pathname: string): UserRole[] | null {
    for (const prefix of Object.keys(ROUTE_PERMISSIONS)) {
        if (pathname.startsWith(prefix)) {
            return ROUTE_PERMISSIONS[prefix];
        }
    }
    return null; // this path isn't protected
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const requiredRoles = getRequiredRoles(pathname);

    // Not a protected route - let it through without checking auth
    if (!requiredRoles) {
        return NextResponse.next();
    }

    // We need a response object we can attach refreshed cookies to
    let response = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Not logged in at all - send to login
    if (!user) {
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
    }

    const role = user.app_metadata?.role as UserRole | undefined;

    // Logged in but role isn't allowed for this route
    if (!role || !requiredRoles.includes(role)) {
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
    }

    return response;
}

export const config = {
    matcher: ["/super-admin/:path*", "/instructor/:path*", "/student/:path*"],
};