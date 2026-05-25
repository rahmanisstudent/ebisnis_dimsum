"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, UserPlus, Mail, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
          // After email confirmation the user will be redirected here
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center surface-card rounded-3xl p-10">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-extrabold text-text-main mb-2">
            Cek Email Kamu!
          </h2>
          <p className="text-text-muted text-sm leading-relaxed">
            Kami telah mengirim link verifikasi ke{" "}
            <span className="font-semibold text-text-main">{email}</span>. Klik
            link tersebut untuk mengaktifkan akun kamu.
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-2xl transition-all duration-300"
          >
            Kembali ke Login
          </Link>
        </div>
      </div>
    );
  }

  const inputClass = "w-full pl-10 pr-4 py-3 border border-border-soft rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 justify-center">
            <span className="text-3xl">🥟</span>
            <span className="font-extrabold text-2xl">
              <span className="text-primary">DimSum</span><span className="text-accent">Store</span>
            </span>
          </a>
          <p className="text-text-muted text-sm mt-2">
            Buat akun untuk mulai memesan
          </p>
        </div>

        {/* Card */}
        <div className="surface-card rounded-3xl p-8">
          <h1 className="text-2xl font-extrabold text-text-main mb-6 text-center">
            Daftar Sekarang
          </h1>

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-2xl">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-text-main">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/60" />
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@kamu.com" required className={inputClass} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-text-main">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/60" />
                <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 6 karakter" required className={`${inputClass} !pr-12`} />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted/60 hover:text-text-main transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm" className="text-sm font-semibold text-text-main">Konfirmasi Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/60" />
                <input id="confirm" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi password" required className={inputClass} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-bold py-3.5 px-6 rounded-2xl transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 mt-2"
            >
              {isPending ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
              {isPending ? "Mendaftar..." : "Buat Akun"}
            </button>
          </form>

          <p className="text-center text-sm text-text-muted mt-6">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
