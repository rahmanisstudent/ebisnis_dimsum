import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/auth/callback
 *
 * Exchanges the Supabase auth code for a session (Google OAuth + email confirm).
 * After session is established, checks the user's role:
 *  - admin    → /admin
 *  - customer → ?next param (defaults to /)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = decodeURIComponent(searchParams.get("next") ?? "/");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check the user's role for proper redirect
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        const destination =
          profile?.role === "admin" ? "/admin" : next;

        return NextResponse.redirect(`${origin}${destination}`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — send to login with error hint
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
