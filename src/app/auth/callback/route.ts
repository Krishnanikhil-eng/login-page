import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const flowId = searchParams.get("sb_flow_id") || searchParams.get("flow_id") || undefined;
  const next = searchParams.get("next") ?? "/profile";

  // Validate internal redirect URL to prevent open redirect vulnerabilities
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/profile";

  const getRedirectDestination = (targetPath: string) => {
    const forwardedHost = request.headers.get("x-forwarded-host");
    const isLocalEnv = process.env.NODE_ENV === "development";
    if (isLocalEnv) {
      return `${origin}${targetPath}`;
    } else if (forwardedHost) {
      return `https://${forwardedHost}${targetPath}`;
    } else {
      return `${origin}${targetPath}`;
    }
  };

  // Upstream error parameters from Supabase Auth or OAuth providers
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  if (errorParam || errorDescription) {
    const errorMsg = errorDescription || errorParam || "Authentication verification failed";
    console.error("Auth callback received upstream error:", {
      error: errorParam,
      description: errorDescription,
    });
    return NextResponse.redirect(
      getRedirectDestination(`/login?error=${encodeURIComponent(errorMsg)}`)
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  // PKCE Authorization Code Exchange
  if (code) {
    const cookieStore = await cookies();
    const pendingCookies: Array<{
      name: string;
      value: string;
      options: Parameters<typeof cookieStore.set>[2];
    }> = [];

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
              pendingCookies.push({ name, value, options });
            });
          } catch {
            // Ignored if invoked in server component render
          }
        },
      },
    });

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined
    );

    if (!exchangeError) {
      const destination = getRedirectDestination(safeNext);
      const response = NextResponse.redirect(destination);
      // Explicitly attach all set cookies to the outgoing redirect response
      pendingCookies.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
      return response;
    }

    console.error("Auth callback code exchange error:", exchangeError.message, {
      code,
      flowId,
      error: exchangeError,
    });

    return NextResponse.redirect(
      getRedirectDestination(
        `/login?error=${encodeURIComponent(
          "Authentication code exchange failed: " + exchangeError.message
        )}`
      )
    );
  }

  // Supabase Token Hash Verification (e.g. email template verifyOtp)
  if (tokenHash && type) {
    const cookieStore = await cookies();
    const pendingCookies: Array<{
      name: string;
      value: string;
      options: Parameters<typeof cookieStore.set>[2];
    }> = [];

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
              pendingCookies.push({ name, value, options });
            });
          } catch {
            // Ignored
          }
        },
      },
    });

    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!verifyError) {
      const destination = getRedirectDestination(safeNext);
      const response = NextResponse.redirect(destination);
      pendingCookies.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
      return response;
    }

    console.error("Auth callback OTP verification error:", verifyError.message);
    return NextResponse.redirect(
      getRedirectDestination(
        `/login?error=${encodeURIComponent(
          "Email verification failed: " + verifyError.message
        )}`
      )
    );
  }

  // Fallback when neither code nor token_hash was provided
  return NextResponse.redirect(
    getRedirectDestination("/login?error=no_auth_code_provided")
  );
}

