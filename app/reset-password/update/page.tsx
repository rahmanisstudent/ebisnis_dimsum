"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();
  const router = useRouter();

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Password tidak cocok."); return; }
    if (password.length < 6) { setError("Password minimal 6 karakter."); return; }

    startTransition(async () => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { setError(error.message); return; }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    });
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center surface-card rounded-3xl p-10">
          <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold text-text-main mb-2">Password Berhasil Diubah!</h2>
          <p className="text-text-muted text-sm">Mengalihkan ke halaman login...</p>
        </div>
      </div>
    );
  }

  const inputClass = "w-full pl-10 pr-12 py-3 border border-border-soft rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white";

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
          <h1 className="text-2xl font-extrabold text-text-main mb-6 text-center">Buat Password Baru</h1>
          <form onSubmit={handleUpdate} className="flex flex-col gap-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-2xl">{error}</div>}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-text-main">Password Baru</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/60" />
                <input id="password" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 6 karakter" required className={inputClass} />
                <button type="button" onClick={() => setShow(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted/60 hover:text-text-main transition-colors">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm" className="text-sm font-semibold text-text-main">Konfirmasi Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/60" />
                <input id="confirm" type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Ulangi password" required className={inputClass} />
              </div>
            </div>
            <button type="submit" disabled={isPending}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-bold py-3.5 px-6 rounded-2xl transition-all duration-300 shadow-lg shadow-primary/20 mt-2">
              {isPending ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              {isPending ? "Memproses..." : "Simpan Password Baru"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
