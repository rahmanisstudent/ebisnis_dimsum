import NavbarCart from "@/components/navbar-cart";
import SharedFooter from "@/components/shared-footer";
import { Shield, Eye, Lock, FileText, ChefHat } from "lucide-react";

export const metadata = {
  title: "Kebijakan Privasi — DimsumStore",
  description: "Kebijakan privasi dan transparansi data pelanggan di DimsumStore.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen" style={{ background: "#fdf6f0" }}>
      {/* ─── Header ────────────────────────────────────────────────────── */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid #f0e8e4", boxShadow: "0 1px 8px rgba(180,60,40,0.06)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", height: "62px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <ChefHat size={22} color="#c0392b" strokeWidth={2.5} />
            <span style={{ fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.4px" }}>
              <span style={{ color: "#c0392b" }}>Dimsum</span>
              <span style={{ color: "#2d2a26" }}>Store</span>
            </span>
          </a>
          <NavbarCart />
        </div>
      </header>

      {/* ─── Main Content ─────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* Page Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
            <Shield size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-text-main">
            Kebijakan Privasi
          </h1>
          <p className="text-text-muted mt-2 text-sm md:text-base">
            Terakhir Diperbarui: {new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Content Cards */}
        <div className="flex flex-col gap-8">
          {/* Card 1 */}
          <section className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 shrink-0">
                <Eye size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-main mb-2">
                  1. Informasi Yang Kami Kumpulkan
                </h2>
                <p className="text-text-muted text-sm leading-relaxed mb-3">
                  Untuk memproses pesanan dan menghitung biaya pengiriman secara akurat, kami mengumpulkan informasi tertentu dari Anda saat melakukan pembelian atau pendaftaran:
                </p>
                <ul className="list-disc list-inside text-text-muted text-sm space-y-1.5 ml-1">
                  <li><strong>Informasi Kontak:</strong> Nama lengkap, alamat email, dan nomor telepon aktif.</li>
                  <li><strong>Informasi Pengiriman:</strong> Alamat pengiriman lengkap, kelurahan, kecamatan, dan kota.</li>
                  <li><strong>Data Lokasi Geografis (GPS):</strong> Koordinat lintang dan bujur (latitude & longitude) yang didapatkan secara opsional ketika Anda menekan tombol "Gunakan Lokasi Saya Saat Ini".</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Card 2 */}
          <section className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 shrink-0">
                <FileText size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-main mb-2">
                  2. Penggunaan Informasi Anda
                </h2>
                <p className="text-text-muted text-sm leading-relaxed mb-3">
                  Seluruh data yang kami kumpulkan digunakan secara eksklusif untuk kepentingan layanan operasional DimsumStore:
                </p>
                <ul className="list-disc list-inside text-text-muted text-sm space-y-1.5 ml-1">
                  <li><strong>Kalkulasi Ongkos Kirim Dinamis:</strong> Koordinat lokasi GPS atau data wilayah kelurahan/kecamatan digunakan untuk menghitung jarak rute pengiriman dan menentukan tarif biaya kirim secara adil.</li>
                  <li><strong>Pemrosesan Transaksi:</strong> Data transaksi dikirimkan ke payment gateway Midtrans Sandbox untuk mengamankan token pembayaran Snap.</li>
                  <li><strong>Pengantaran Makanan:</strong> Nama, nomor telepon, dan alamat Anda diberikan kepada kurir internal atau layanan ojek online lokal (area Yogyakarta) untuk mempermudah proses pengantaran makanan.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Card 3 */}
          <section className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shrink-0">
                <Lock size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-main mb-2">
                  3. Keamanan Data Pelanggan
                </h2>
                <p className="text-text-muted text-sm leading-relaxed">
                  Kami mengutamakan keamanan informasi pribadi Anda. Sistem basis data kami dilindungi oleh enkripsi modern dari platform Supabase Database. Seluruh pembayaran diproses melalui payment gateway eksternal berlisensi (Midtrans) sehingga kami tidak pernah menyimpan data kartu kredit atau kredensial pembayaran sensitif lainnya di server kami.
                </p>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <div className="bg-primary/5 rounded-3xl p-6 md:p-8 border border-primary/10 text-center">
            <h3 className="font-bold text-text-main mb-1">Punya Pertanyaan Lain?</h3>
            <p className="text-text-muted text-xs md:text-sm mb-4">
              Jika Anda memiliki pertanyaan lebih lanjut mengenai kebijakan penggunaan data Anda, silakan hubungi tim kami via WhatsApp.
            </p>
            <a
              href="https://wa.me/6287885559642?text=Halo%20Admin%20DimsumStore,%20saya%20ingin%20bertanya%20mengenai%20kebijakan%20privasi..."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20BA5A] text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow transition-all duration-200"
            >
              Hubungi WhatsApp Hotline
            </a>
          </div>
        </div>
      </main>

      <SharedFooter />
    </div>
  );
}
