"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function AdminErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="text-red-400" size={28} />
        </div>
        <h1 className="text-xl font-extrabold text-white mb-2">
          Terjadi Kesalahan
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Gagal memuat halaman. Silakan coba lagi.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-xl transition-all text-sm"
          >
            <RefreshCw size={14} />
            Coba Lagi
          </button>
          <Link
            href="/admin"
            className="flex items-center gap-2 border border-gray-700 text-gray-400 hover:text-white font-bold py-2.5 px-5 rounded-xl transition-all text-sm"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
