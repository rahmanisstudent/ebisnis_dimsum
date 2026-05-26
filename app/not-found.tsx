import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="text-7xl mb-4">🥟</div>
        <h1 className="text-5xl font-extrabold text-text-main mb-2">404</h1>
        <h2 className="text-xl font-bold text-text-main mb-3">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-text-muted text-sm mb-8 leading-relaxed">
          Sepertinya dimsum yang kamu cari sudah habis! Halaman ini tidak tersedia atau sudah dipindahkan.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-2xl transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0"
        >
          Kembali ke Menu
        </Link>
      </div>
    </div>
  );
}
