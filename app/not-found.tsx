import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fdf6f0", padding: "1.5rem", fontFamily: "var(--font-sans)" }}>
      <div style={{ width: "100%", maxWidth: "400px", textAlign: "center" }}>
        <div style={{ width: 96, height: 96, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
          <SearchX size={44} color="#c0392b" strokeWidth={1.75} />
        </div>
        <h1 style={{ fontSize: "3.5rem", fontWeight: 900, color: "#1a1a1a", marginBottom: "0.5rem", lineHeight: 1 }}>404</h1>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1a1a1a", marginBottom: "0.75rem" }}>
          Halaman Tidak Ditemukan
        </h2>
        <p style={{ color: "#6b6560", fontSize: "0.875rem", marginBottom: "2rem", lineHeight: 1.6 }}>
          Sepertinya halaman yang kamu cari sudah tidak tersedia atau telah dipindahkan.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.9rem",
            padding: "0.875rem 2rem",
            borderRadius: "50px",
            textDecoration: "none",
            boxShadow: "0 4px 14px rgba(192,57,43,0.35)",
          }}
        >
          Kembali ke Menu
        </Link>
      </div>
    </div>
  );
}
