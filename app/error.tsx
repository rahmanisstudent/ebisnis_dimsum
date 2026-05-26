"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="text-red-400" size={36} />
        </div>
        <h1 className="text-2xl font-extrabold text-text-main mb-2">
          Terjadi Kesalahan
        </h1>
        <p className="text-text-muted text-sm mb-8 leading-relaxed">
          Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi atau kembali ke halaman utama.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300 shadow-lg shadow-primary/20"
          >
            <RefreshCw size={16} />
            Coba Lagi
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 border border-border-soft text-text-main font-bold py-3 px-6 rounded-2xl transition-all duration-300 hover:bg-cream"
          >
            Kembali
          </Link>
        </div>
      </div>
    </div>
  );
}
