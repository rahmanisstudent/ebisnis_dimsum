"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ArrowRight, Mail, Lock, ChefHat, CheckCircle2 } from "lucide-react";
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
    if (password !== confirmPassword) { setError("Password tidak cocok. Coba lagi."); return; }
    if (password.length < 6) { setError("Password minimal 6 karakter."); return; }

    startTransition(async () => {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
      });
      if (error) { setError(error.message); return; }
      setSuccess(true);
    });
  }

  /* ── Left panel (shared) ─────────────────────────────────────────────── */
  const LeftPanel = (
    <div style={styles.leftPanel}>
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.leftContent}>
        <a href="/" style={styles.brandLink}>
          <ChefHat size={20} color="#7a1a0e" strokeWidth={2.5} />
          <span style={styles.brandName}>DimsumStore</span>
        </a>
        <div style={styles.illustrationRing}>
          <div style={styles.illustrationInner}>
            <ChefHat size={42} color="#c0392b" strokeWidth={1.75} />
          </div>
        </div>
        <p style={styles.tagline}>
          {success
            ? "Satu langkah lagi! Cek email kamu untuk verifikasi."
            : "Bergabunglah dan nikmati pengalaman dimsum premium kamu!"}
        </p>
      </div>
    </div>
  );

  /* ── Success state ── */
  if (success) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          {LeftPanel}
          <div style={{ ...styles.rightPanel, alignItems: "center", justifyContent: "center", textAlign: "center", gap: "1.25rem" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Mail size={32} color="#c0392b" strokeWidth={1.75} />
            </div>
            <div>
              <h2 style={{ ...styles.welcomeTitle, fontSize: "1.3rem" }}>Cek Email Kamu!</h2>
              <p style={{ fontSize: "0.82rem", color: "#999", lineHeight: 1.7, marginTop: "0.35rem" }}>
                Link verifikasi dikirim ke{" "}
                <span style={{ fontWeight: 700, color: "#2d2a26" }}>{email}</span>.
              </p>
            </div>
            <Link href="/login" style={styles.submitBtn as React.CSSProperties}>
              Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* ── Centered Card ── */}
      <div style={styles.card}>

        {LeftPanel}

        {/* ── Right Panel ── */}
        <div style={styles.rightPanel}>
          <div style={styles.formHeader}>
            <h1 style={styles.welcomeTitle}>Buat Akun Baru</h1>
            <p style={styles.welcomeSub}>Isi detail kamu untuk mendaftar.</p>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <form onSubmit={handleRegister} style={styles.form}>
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
              <label htmlFor="password" style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={15} style={styles.inputIcon} />
                <input
                  id="password" type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter" required
                  style={{ ...styles.input, paddingRight: "2.75rem" }}
                  onFocus={(e) => Object.assign(e.target.style, { ...styles.inputFocus, paddingRight: "2.75rem" })}
                  onBlur={(e) => Object.assign(e.target.style, { ...styles.input, paddingRight: "2.75rem" })}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div style={styles.fieldGroup}>
              <label htmlFor="confirm" style={styles.label}>Konfirmasi Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={15} style={styles.inputIcon} />
                <input
                  id="confirm" type={showConfirm ? "text" : "password"} value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password kamu" required
                  style={{ ...styles.input, paddingRight: "2.75rem" }}
                  onFocus={(e) => Object.assign(e.target.style, { ...styles.inputFocus, paddingRight: "2.75rem" })}
                  onBlur={(e) => Object.assign(e.target.style, { ...styles.input, paddingRight: "2.75rem" })}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)} style={styles.eyeBtn}>
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
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
                : <><span>Buat Akun</span><ArrowRight size={17} /></>}
            </button>
          </form>

          {/* Footer */}
          <p style={styles.footerText}>
            Sudah punya akun?{" "}
            <Link href="/login" style={styles.footerLink}>Masuk di sini</Link>
          </p>
        </div>

      </div>
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────── */
const styles: Record<string, React.CSSProperties> = {
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

  card: {
    display: "flex",
    width: "100%",
    maxWidth: "800px",
    minHeight: "490px",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(180,60,40,0.13), 0 4px 16px rgba(0,0,0,0.07)",
  },

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
    position: "absolute", top: "-50px", left: "-50px",
    width: "180px", height: "180px",
    borderRadius: "50%", background: "rgba(255,255,255,0.18)",
  },
  blob2: {
    position: "absolute", bottom: "-60px", right: "-40px",
    width: "200px", height: "200px",
    borderRadius: "50%", background: "rgba(255,255,255,0.12)",
  },
  leftContent: {
    position: "relative", zIndex: 1, textAlign: "center",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem",
  },
  brandLink: { display: "flex", alignItems: "center", gap: "0.4rem", textDecoration: "none" },
  brandIcon: { fontSize: "1.5rem" },
  brandName: { fontSize: "1.2rem", fontWeight: 800, color: "#7a1a0e", letterSpacing: "-0.4px" },
  illustrationRing: {
    width: "130px", height: "130px", borderRadius: "50%",
    background: "rgba(255,255,255,0.35)", display: "flex",
    alignItems: "center", justifyContent: "center",
    boxShadow: "0 8px 24px rgba(180,60,40,0.18)",
    border: "3px solid rgba(255,255,255,0.6)",
  },
  illustrationInner: {
    width: "98px", height: "98px", borderRadius: "50%",
    background: "rgba(255,255,255,0.6)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  dimsumEmoji: { fontSize: "3.5rem", lineHeight: 1 },
  tagline: {
    fontSize: "0.78rem", color: "#7a1a0e", lineHeight: 1.7,
    maxWidth: "180px", textAlign: "center", fontWeight: 500,
  },

  rightPanel: {
    flex: 1,
    background: "#ffffff",
    padding: "1.875rem 2.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.8rem",
    overflowY: "auto",
  },
  formHeader: { marginBottom: "0.1rem" },
  welcomeTitle: { fontSize: "1.4rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.2rem" },
  welcomeSub: { fontSize: "0.82rem", color: "#999" },

  errorBox: {
    background: "#fef2f2", border: "1px solid #fecaca",
    color: "#dc2626", fontSize: "0.8rem",
    padding: "0.6rem 0.875rem", borderRadius: "10px",
  },

  form: { display: "flex", flexDirection: "column", gap: "0.8rem" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "0.35rem" },
  label: { fontSize: "0.8rem", fontWeight: 600, color: "#2d2a26" },
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
    position: "absolute", right: "0.75rem",
    background: "none", border: "none", cursor: "pointer",
    color: "#c0aaa4", display: "flex", alignItems: "center", padding: 0,
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
    fontSize: "0.9rem",
    padding: "0.75rem 1.25rem",
    borderRadius: "50px",
    border: "none",
    cursor: "pointer",
    marginTop: "0.25rem",
    boxShadow: "0 4px 14px rgba(192,57,43,0.32)",
    letterSpacing: "0.2px",
    textDecoration: "none",
  },

  footerText: { textAlign: "center", fontSize: "0.8rem", color: "#999", marginTop: "0.25rem" },
  footerLink: { color: "#c0392b", fontWeight: 700, textDecoration: "none" },
};
