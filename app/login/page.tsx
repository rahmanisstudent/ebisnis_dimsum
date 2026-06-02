"use client";

import { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ArrowRight, Mail, Lock, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#fdf6f0" }}>
          <Loader2 className="animate-spin" size={32} style={{ color: "#c0392b" }} />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom") ?? "/";

  const supabase = createClient();

  async function redirectByRole() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(redirectedFrom);
      router.refresh();
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const destination = profile?.role === "admin" ? "/admin" : redirectedFrom;
    router.push(destination);
    router.refresh();
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(
          error.message === "Invalid login credentials"
            ? "Email atau password salah."
            : error.message
        );
        return;
      }
      await redirectByRole();
    });
  }

  async function handleGoogleLogin() {
    setError(null);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(redirectedFrom)}`,
      },
    });
  }

  return (
    <div style={styles.pageWrapper}>
      {/* ── Left Panel ── */}
      <div style={styles.leftPanel}>
        {/* Decorative blobs */}
        <div style={styles.blob1} />
        <div style={styles.blob2} />

        <div style={styles.leftContent}>
          {/* Brand logo */}
          <a href="/" style={styles.brandLink}>
            <span style={styles.brandIcon}>🥟</span>
            <span style={styles.brandName}>DimsumStore</span>
          </a>

          {/* Dimsum illustration */}
          <div style={styles.illustrationRing}>
            <div style={styles.illustrationInner}>
              <span style={styles.dimsumEmoji}>🥟</span>
            </div>
          </div>

          {/* Tagline */}
          <p style={styles.tagline}>
            Fresh, hot, and undeniably cute.<br />
            Your premium dumpling experience starts here.
          </p>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div style={styles.rightPanel}>
        <div style={styles.formContainer}>
          <div style={styles.formHeader}>
            <h1 style={styles.welcomeTitle}>Selamat Datang! 👋</h1>
            <p style={styles.welcomeSub}>Masukkan detail kamu untuk masuk.</p>
          </div>

          {error && (
            <div style={styles.errorBox}>
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} style={styles.form}>
            {/* Email */}
            <div style={styles.fieldGroup}>
              <label htmlFor="email" style={styles.label}>Alamat Email</label>
              <div style={styles.inputWrapper}>
                <Mail size={16} style={styles.inputIcon} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@example.com"
                  required
                  style={styles.input}
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, styles.input)}
                />
              </div>
            </div>

            {/* Password */}
            <div style={styles.fieldGroup}>
              <div style={styles.labelRow}>
                <label htmlFor="password" style={styles.label}>Password</label>
                <Link href="/reset-password" style={styles.forgotLink}>Lupa password?</Link>
              </div>
              <div style={styles.inputWrapper}>
                <Lock size={16} style={styles.inputIcon} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ ...styles.input, paddingRight: "3rem" }}
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, { ...styles.input, paddingRight: "3rem" })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              style={isPending ? { ...styles.submitBtn, opacity: 0.7 } : styles.submitBtn}
            >
              {isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Masuk <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={styles.divider}>
            <div style={styles.dividerLine} />
            <span style={styles.dividerText}>ATAU</span>
            <div style={styles.dividerLine} />
          </div>

          {/* Google */}
          <button onClick={handleGoogleLogin} style={styles.googleBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Lanjutkan dengan Google
          </button>

          {/* Footer links */}
          <p style={styles.footerText}>
            Belum punya akun?{" "}
            <Link href="/register" style={styles.footerLink}>Daftar di sini</Link>
          </p>

          <button
            onClick={() => router.push("/")}
            style={styles.guestBtn}
          >
            <User size={15} />
            Lanjutkan sebagai Tamu
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Inline styles ──────────────────────────────────────────────────────── */
const styles: Record<string, React.CSSProperties> = {
  pageWrapper: {
    display: "flex",
    minHeight: "100vh",
    background: "#fdf6f0",
    fontFamily: "var(--font-sans)",
  },

  /* Left panel */
  leftPanel: {
    position: "relative",
    width: "40%",
    background: "linear-gradient(145deg, #f5c6bc 0%, #f0a899 40%, #e87d6e 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: "2rem",
  },
  blob1: {
    position: "absolute",
    top: "-60px",
    left: "-60px",
    width: "220px",
    height: "220px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.18)",
  },
  blob2: {
    position: "absolute",
    bottom: "-80px",
    right: "-50px",
    width: "280px",
    height: "280px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.12)",
  },
  leftContent: {
    position: "relative",
    zIndex: 1,
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1.5rem",
  },
  brandLink: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    textDecoration: "none",
  },
  brandIcon: {
    fontSize: "1.8rem",
  },
  brandName: {
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "#7a1a0e",
    letterSpacing: "-0.5px",
  },
  illustrationRing: {
    width: "160px",
    height: "160px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 32px rgba(180,60,40,0.18)",
    border: "4px solid rgba(255,255,255,0.6)",
  },
  illustrationInner: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dimsumEmoji: {
    fontSize: "4.5rem",
    lineHeight: 1,
  },
  tagline: {
    fontSize: "0.875rem",
    color: "#7a1a0e",
    lineHeight: 1.7,
    maxWidth: "220px",
    textAlign: "center",
    fontWeight: 500,
  },

  /* Right panel */
  rightPanel: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    background: "#fdf6f0",
  },
  formContainer: {
    width: "100%",
    maxWidth: "420px",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  formHeader: {
    marginBottom: "0.5rem",
  },
  welcomeTitle: {
    fontSize: "1.75rem",
    fontWeight: 800,
    color: "#1a1a1a",
    marginBottom: "0.25rem",
  },
  welcomeSub: {
    fontSize: "0.9rem",
    color: "#888",
  },

  /* Error */
  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    fontSize: "0.85rem",
    padding: "0.75rem 1rem",
    borderRadius: "12px",
  },

  /* Form */
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  label: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#2d2a26",
  },
  labelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotLink: {
    fontSize: "0.8rem",
    color: "#c0392b",
    textDecoration: "none",
    fontWeight: 600,
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "0.875rem",
    color: "#b0aaa4",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    padding: "0.75rem 1rem 0.75rem 2.5rem",
    border: "1.5px solid #f0e8e4",
    borderRadius: "12px",
    fontSize: "0.9rem",
    background: "#fff8f5",
    color: "#2d2a26",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  inputFocus: {
    width: "100%",
    padding: "0.75rem 1rem 0.75rem 2.5rem",
    border: "1.5px solid #e87d6e",
    borderRadius: "12px",
    fontSize: "0.9rem",
    background: "#fff8f5",
    color: "#2d2a26",
    outline: "none",
    boxShadow: "0 0 0 3px rgba(232,125,110,0.15)",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  eyeBtn: {
    position: "absolute",
    right: "0.875rem",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#b0aaa4",
    display: "flex",
    alignItems: "center",
    padding: 0,
  },

  /* Submit button */
  submitBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    background: "linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)",
    color: "#fff",
    fontWeight: 700,
    fontSize: "1rem",
    padding: "0.875rem 1.5rem",
    borderRadius: "50px",
    border: "none",
    cursor: "pointer",
    marginTop: "0.5rem",
    boxShadow: "0 4px 16px rgba(192,57,43,0.35)",
    transition: "transform 0.15s, box-shadow 0.15s",
    letterSpacing: "0.2px",
  },

  /* Divider */
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#ede8e3",
  },
  dividerText: {
    fontSize: "0.75rem",
    color: "#aaa",
    fontWeight: 600,
    letterSpacing: "0.5px",
  },

  /* Google button */
  googleBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.625rem",
    background: "#fff",
    border: "1.5px solid #ede8e3",
    borderRadius: "50px",
    padding: "0.8rem 1.5rem",
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#2d2a26",
    cursor: "pointer",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },

  /* Footer */
  footerText: {
    textAlign: "center",
    fontSize: "0.85rem",
    color: "#888",
    marginTop: "0.25rem",
  },
  footerLink: {
    color: "#c0392b",
    fontWeight: 700,
    textDecoration: "none",
  },
  guestBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    background: "transparent",
    border: "1.5px solid #ede8e3",
    borderRadius: "50px",
    padding: "0.7rem 1.5rem",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#888",
    cursor: "pointer",
    transition: "border-color 0.2s",
  },
};
