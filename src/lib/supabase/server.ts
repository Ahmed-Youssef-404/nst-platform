// src/lib/supabase/server.ts
// Centralized factory for creating a Supabase client that works on the server
// (Server Components, Server Actions, Route Handlers)
// This reads/writes the user's session via Next.js cookies

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // setAll was called from a Server Component, where cookies
                        // can't be modified. This is safe to ignore if you have
                        // middleware refreshing sessions on every request.
                    }
                },
            },
        }
    );
}