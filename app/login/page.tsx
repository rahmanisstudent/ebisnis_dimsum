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
        <div style={styles.page}>
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push(redirectedFrom); router.refresh(); return; }
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
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
        setError(error.message === "Invalid login credentials" ? "Email atau password salah." : error.message);
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
    <div style={styles.page}>
      {/* ── Centered Card ── */}
      <div style={styles.card}>

        {/* ── Left Panel ── */}
        <div style={styles.leftPanel}>
          <div style={styles.blob1} />
          <div style={styles.blob2} />
          <div style={styles.leftContent}>
            <a href="/" style={styles.brandLink}>
              <span style={styles.brandIcon}>🥟</span>
              <span style={styles.brandName}>DimsumStore</span>
            </a>
            <div style={styles.illustrationRing}>
              <div style={styles.illustrationInner}>
                <span style={styles.dimsumEmoji}>🥟</span>
              </div>
            </div>
            <p style={styles.tagline}>
              Fresh, hot, and undeniably cute.<br />
              Your premium dumpling experience starts here.
            </p>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div style={styles.rightPanel}>
          <div style={styles.formHeader}>
            <h1 style={styles.welcomeTitle}>Selamat Datang! 👋</h1>
            <p style={styles.welcomeSub}>Masukkan detail kamu untuk masuk.</p>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <form onSubmit={handleEmailLogin} style={styles.form}>
            {/* Email */}
            <div style={styles.fieldGroup}>
              <label htmlFor="email" style={styles.label}>Alamat Email</label>
              <div style={styles.inputWrapper}>
                <Mail size={15} style={styles.inputIcon} />
                <input
                  id="email" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@example.com" required
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
                <Lock size={15} style={styles.inputIcon} />
                <input
                  id="password" type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  style={{ ...styles.input, paddingRight: "2.75rem" }}
                  onFocus={(e) => Object.assign(e.target.style, { ...styles.inputFocus, paddingRight: "2.75rem" })}
                  onBlur={(e) => Object.assign(e.target.style, { ...styles.input, paddingRight: "2.75rem" })}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={isPending}
              style={isPending ? { ...styles.submitBtn, opacity: 0.7 } : styles.submitBtn}
            >
              {isPending
                ? <Loader2 size={17} className="animate-spin" />
                : <><span>Masuk</span><ArrowRight size={17} /></>}
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
            <svg width="17" height="17" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Lanjutkan dengan Google
          </button>

          {/* Footer */}
          <p style={styles.footerText}>
            Belum punya akun?{" "}
            <Link href="/register" style={styles.footerLink}>Daftar di sini</Link>
          </p>

          <button onClick={() => router.push("/")} style={styles.guestBtn}>
            <User size={14} />
            Lanjutkan sebagai Tamu
          </button>
        </div>

      </div>
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────── */
const styles: Record<string, React.CSSProperties> = {
  /* Outer page – centers the card */
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1.5rem",
    background:
      "radial-gradient(ellipse at top right, #f5e6e0 0%, transparent 55%), " +
      "radial-gradient(ellipse at bottom left, #fde8e0 0%, transparent 55%), #fdf6f0",
    fontFamily: "var(--font-sans)",
  },

  /* Card wrapper – this is what the user sees as "the card" */
  card: {
    display: "flex",
    width: "100%",
    maxWidth: "800px",
    minHeight: "470px",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow:
      "0 20px 60px rgba(180,60,40,0.13), 0 4px 16px rgba(0,0,0,0.07)",
  },

  /* Left panel – lives inside the card */
  leftPanel: {
    position: "relative",
    width: "38%",
    flexShrink: 0,
    background: "linear-gradient(145deg, #f5c6bc 0%, #f0a899 40%, #e87d6e 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: "2rem 1.5rem",
  },
  blob1: {
    position: "absolute",
    top: "-50px",
    left: "-50px",
    width: "180px",
    height: "180px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.18)",
  },
  blob2: {
    position: "absolute",
    bottom: "-60px",
    right: "-40px",
    width: "200px",
    height: "200px",
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
    gap: "1.25rem",
  },
  brandLink: { display: "flex", alignItems: "center", gap: "0.4rem", textDecoration: "none" },
  brandIcon: { fontSize: "1.5rem" },
  brandName: { fontSize: "1.2rem", fontWeight: 800, color: "#7a1a0e", letterSpacing: "-0.4px" },
  illustrationRing: {
    width: "130px",
    height: "130px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 24px rgba(180,60,40,0.18)",
    border: "3px solid rgba(255,255,255,0.6)",
  },
  illustrationInner: {
    width: "98px",
    height: "98px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dimsumEmoji: { fontSize: "3.5rem", lineHeight: 1 },
  tagline: {
    fontSize: "0.78rem",
    color: "#7a1a0e",
    lineHeight: 1.7,
    maxWidth: "180px",
    textAlign: "center",
    fontWeight: 500,
  },

  /* Right panel – lives inside the card */
  rightPanel: {
    flex: 1,
    background: "#ffffff",
    padding: "2rem 2.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.875rem",
    overflowY: "auto",
  },
  formHeader: { marginBottom: "0.1rem" },
  welcomeTitle: { fontSize: "1.4rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.2rem" },
  welcomeSub: { fontSize: "0.82rem", color: "#999" },

  /* Error */
  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    fontSize: "0.8rem",
    padding: "0.6rem 0.875rem",
    borderRadius: "10px",
  },

  /* Form */
  form: { display: "flex", flexDirection: "column", gap: "0.875rem" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "0.35rem" },
  label: { fontSize: "0.8rem", fontWeight: 600, color: "#2d2a26" },
  labelRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  forgotLink: { fontSize: "0.75rem", color: "#c0392b", textDecoration: "none", fontWeight: 600 },
  inputWrapper: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: { position: "absolute", left: "0.75rem", color: "#c0aaa4", pointerEvents: "none" },
  input: {
    width: "100%",
    padding: "0.65rem 0.875rem 0.65rem 2.25rem",
    border: "1.5px solid #f0e8e4",
    borderRadius: "10px",
    fontSize: "0.85rem",
    background: "#fff8f5",
    color: "#2d2a26",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
  },
  inputFocus: {
    width: "100%",
    padding: "0.65rem 0.875rem 0.65rem 2.25rem",
    border: "1.5px solid #e87d6e",
    borderRadius: "10px",
    fontSize: "0.85rem",
    background: "#fff8f5",
    color: "#2d2a26",
    outline: "none",
    boxShadow: "0 0 0 3px rgba(232,125,110,0.12)",
    boxSizing: "border-box",
  },
  eyeBtn: {
    position: "absolute",
    right: "0.75rem",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#c0aaa4",
    display: "flex",
    alignItems: "center",
    padding: 0,
  },

  /* Submit */
  submitBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    background: "linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)",
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.9rem",
    padding: "0.75rem 1.25rem",
    borderRadius: "50px",
    border: "none",
    cursor: "pointer",
    marginTop: "0.25rem",
    boxShadow: "0 4px 14px rgba(192,57,43,0.32)",
    letterSpacing: "0.2px",
  },

  /* Divider */
  divider: { display: "flex", alignItems: "center", gap: "0.625rem" },
  dividerLine: { flex: 1, height: "1px", background: "#f0e8e4" },
  dividerText: { fontSize: "0.7rem", color: "#bbb", fontWeight: 600, letterSpacing: "0.5px" },

  /* Google */
  googleBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    background: "#fff",
    border: "1.5px solid #ede8e3",
    borderRadius: "50px",
    padding: "0.65rem 1.25rem",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#2d2a26",
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },

  /* Footer */
  footerText: { textAlign: "center", fontSize: "0.8rem", color: "#999" },
  footerLink: { color: "#c0392b", fontWeight: 700, textDecoration: "none" },
  guestBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.4rem",
    background: "transparent",
    border: "1.5px solid #ede8e3",
    borderRadius: "50px",
    padding: "0.6rem 1rem",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#aaa",
    cursor: "pointer",
  },
};
