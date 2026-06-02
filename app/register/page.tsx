"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ArrowRight, Mail, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const supabase = createClient();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Password tidak cocok. Coba lagi.");
      return;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    startTransition(async () => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
    });
  }

  /* ── Success state ──────────────────────────────────────────────── */
  if (success) {
    return (
      <div style={styles.pageWrapper}>
        {/* Left panel */}
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
              Satu langkah lagi dan<br />pengalaman dimsum kamu dimulai!
            </p>
          </div>
        </div>

        {/* Right panel – success */}
        <div style={styles.rightPanel}>
          <div style={{ ...styles.formContainer, textAlign: "center", gap: "1.25rem" }}>
            <div style={{ fontSize: "4rem" }}>📧</div>
            <h2 style={{ ...styles.welcomeTitle, fontSize: "1.5rem" }}>Cek Email Kamu!</h2>
            <p style={{ fontSize: "0.9rem", color: "#888", lineHeight: 1.7 }}>
              Kami telah mengirim link verifikasi ke{" "}
              <span style={{ fontWeight: 700, color: "#2d2a26" }}>{email}</span>.
              Klik link tersebut untuk mengaktifkan akun kamu.
            </p>
            <Link href="/login" style={styles.submitBtn as React.CSSProperties}>
              Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
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
            Bergabunglah dan nikmati<br />pengalaman dimsum premium kamu!
          </p>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div style={styles.rightPanel}>
        <div style={styles.formContainer}>
          <div style={styles.formHeader}>
            <h1 style={styles.welcomeTitle}>Buat Akun Baru! ✨</h1>
            <p style={styles.welcomeSub}>Isi detail kamu untuk mendaftar.</p>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <form onSubmit={handleRegister} style={styles.form}>
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
              <label htmlFor="password" style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={16} style={styles.inputIcon} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
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

            {/* Confirm Password */}
            <div style={styles.fieldGroup}>
              <label htmlFor="confirm" style={styles.label}>Konfirmasi Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={16} style={styles.inputIcon} />
                <input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password kamu"
                  required
                  style={{ ...styles.input, paddingRight: "3rem" }}
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, { ...styles.input, paddingRight: "3rem" })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  style={styles.eyeBtn}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
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
                  Buat Akun <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p style={styles.footerText}>
            Sudah punya akun?{" "}
            <Link href="/login" style={styles.footerLink}>Masuk di sini</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Inline styles ─────────────────────────────────────────────────────── */
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
  brandIcon: { fontSize: "1.8rem" },
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
  formHeader: { marginBottom: "0.25rem" },
  welcomeTitle: {
    fontSize: "1.75rem",
    fontWeight: 800,
    color: "#1a1a1a",
    marginBottom: "0.25rem",
  },
  welcomeSub: { fontSize: "0.9rem", color: "#888" },

  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    fontSize: "0.85rem",
    padding: "0.75rem 1rem",
    borderRadius: "12px",
  },

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
    marginTop: "0.25rem",
    boxShadow: "0 4px 16px rgba(192,57,43,0.35)",
    textDecoration: "none",
    letterSpacing: "0.2px",
  },
  footerText: {
    textAlign: "center",
    fontSize: "0.85rem",
    color: "#888",
    marginTop: "0.5rem",
  },
  footerLink: {
    color: "#c0392b",
    fontWeight: 700,
    textDecoration: "none",
  },
};
