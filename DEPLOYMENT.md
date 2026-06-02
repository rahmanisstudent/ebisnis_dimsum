# Panduan Deployment Live (Gratis) dengan Vercel & Supabase

Karena Anda tidak memiliki VPS atau domain sendiri, kombinasi **Vercel** (untuk frontend & serverless API Next.js) dan **Supabase** (untuk database PostgreSQL & Authentication) adalah solusi terbaik yang **100% gratis** dan siap pakai.

---

## 🛠️ Langkah 1: Hubungkan ke GitHub
Vercel terintegrasi langsung dengan GitHub untuk deployment otomatis setiap kali Anda melakukan `git push`.

1. Buat repositori baru di [GitHub](https://github.com/) (atur sebagai **Private** agar kunci rahasia API Anda aman).
2. Di terminal komputer lokal Anda, inisialisasi Git dan dorong (push) kode:
   ```bash
   git init
   git add .
   git commit -m "Inisialisasi Project Dimsum Store"
   git branch -M main
   git remote add origin https://github.com/username-anda/nama-repo-anda.git
   git push -u origin main
   ```

---

## 🚀 Langkah 2: Deploy ke Vercel (Gratis)
Vercel mendeteksi aplikasi Next.js secara otomatis dan mengkonfigurasinya.

1. Buka [Vercel](https://vercel.com/) dan masuk menggunakan akun GitHub Anda.
2. Klik tombol **"Add New"** > **"Project"**.
3. Cari repositori GitHub Anda dan klik **"Import"**.
4. Di bagian **Environment Variables**, masukkan semua variabel lingkungan dari file `.env` lokal Anda:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `MIDTRANS_SERVER_KEY`
   - `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`
   - `MIDTRANS_IS_PRODUCTION` (Set ke `false` untuk mode Sandbox)
   - `NEXT_PUBLIC_BASE_URL` (Set ke alamat Vercel Anda nanti setelah di-deploy, contoh: `https://dimsum-store.vercel.app`)
5. Klik **"Deploy"**. Dalam beberapa menit, situs Anda akan live di alamat subdomain gratis (contoh: `https://nama-proyek.vercel.app`).

---

## 🔗 Langkah 3: Perbarui URL Callback & Webhook
Setelah website Anda memiliki URL Vercel resmi (misalnya: `https://dimsum-store.vercel.app`), Anda harus memperbarui konfigurasi integrasi pihak ketiga:

### 1. Konfigurasi Supabase Auth
Supabase perlu tahu ke mana harus mengarahkan pengguna kembali setelah proses login/verifikasi email:
- Buka dashboard [Supabase](https://supabase.com/).
- Buka **Authentication** > **URL Configuration**.
- Di bagian **Site URL**, masukkan URL Vercel Anda:
  `https://dimsum-store.vercel.app`
- Di bagian **Redirect URLs**, tambahkan URL callback auth:
  `https://dimsum-store.vercel.app/api/auth/callback`

### 2. Konfigurasi Midtrans Sandbox
Supanya status pesanan berubah otomatis dari `pending` ke `paid` setelah pelanggan membayar di gerbang pembayaran:
- Buka Dashboard [Midtrans Merchant](https://dashboard.sandbox.midtrans.com/).
- Buka **Settings** > **Configuration**.
- Ubah **Payment Notification URL** menjadi endpoint webhook Anda:
  `https://dimsum-store.vercel.app/api/midtrans/webhook`
- Ubah **Finish Redirect URL** (di bawah Notification URL) ke:
  `https://dimsum-store.vercel.app/orders`

---

## 💡 Keuntungan Menggunakan Metode Ini
- **Tanpa Biaya**: Rencana gratis Vercel dan Supabase sangat memadai untuk tugas kuliah skala kecil/menengah.
- **SSL Otomatis**: Vercel menyediakan HTTPS (SSL aman) secara instan dan gratis.
- **CI/CD Otomatis**: Setiap kali Anda mengubah kode lokal dan melakukan `git push`, Vercel akan otomatis memperbarui situs live Anda dalam waktu kurang dari 2 menit.
