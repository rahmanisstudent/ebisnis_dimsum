"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Mail, Loader2, ArrowLeft, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password/update`,
      });
      if (error) { setError(error.message); return; }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center surface-card rounded-3xl p-10">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-extrabold text-text-main mb-2">Cek Email Kamu!</h2>
          <p className="text-text-muted text-sm leading-relaxed">
            Kami telah mengirim link reset password ke <span className="font-semibold text-text-main">{email}</span>.
          </p>
          <Link href="/login" className="inline-block mt-6 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-2xl transition-all duration-300">
            Kembali ke Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 justify-center">
            <span className="text-3xl">🥟</span>
            <span className="font-extrabold text-2xl"><span className="text-primary">DimSum</span><span className="text-accent">Store</span></span>
          </a>
        </div>
        <div className="surface-card rounded-3xl p-8">
          <h1 className="text-2xl font-extrabold text-text-main mb-2 text-center">Lupa Password?</h1>
          <p className="text-text-muted text-sm text-center mb-6">Masukkan email terdaftar untuk menerima link reset.</p>
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-2xl">{error}</div>}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-text-main">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/60" />
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@kamu.com" required
                  className="w-full pl-10 pr-4 py-3 border border-border-soft rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white" />
              </div>
            </div>
            <button type="submit" disabled={isPending}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-bold py-3.5 px-6 rounded-2xl transition-all duration-300 shadow-lg shadow-primary/20 mt-2">
              {isPending ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
              {isPending ? "Mengirim..." : "Kirim Link Reset"}
            </button>
          </form>
          <p className="text-center text-sm text-text-muted mt-6">
            <Link href="/login" className="text-primary font-bold hover:underline inline-flex items-center gap-1"><ArrowLeft size={14} /> Kembali ke Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
