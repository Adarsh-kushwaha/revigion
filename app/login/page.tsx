"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  async function handleGoogleSignIn() {
    const supabase = createClient();
    const callbackUrl = `${window.location.origin}/auth/callback`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
        queryParams: { access_type: "offline", prompt: "consent" },
        scopes: "email profile",
      },
    });
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#FAFAF6" }}
    >
      <div
        className="w-full max-w-[430px] rounded-2xl shadow-sm border p-8 flex flex-col items-center gap-8"
        style={{
          backgroundColor: "#FFFFFF",
          borderColor: "rgba(17,17,16,0.08)",
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <span
            className="text-3xl font-bold tracking-tight"
            style={{ color: "#111110", fontFamily: "var(--font-heading)" }}
          >
            Revigion
          </span>
          <span className="text-sm" style={{ color: "#6B6A65" }}>
            Spaced-repetition revision tracker
          </span>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
          style={{
            backgroundColor: "#FFFFFF",
            color: "#111110",
            border: "1px solid rgba(17,17,16,0.14)",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#F5F5F1")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "#FFFFFF")
          }
        >
          <GoogleIcon />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
