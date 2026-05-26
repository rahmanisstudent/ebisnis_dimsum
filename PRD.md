# PRD — DimsumStore E-Commerce

> **Status**: Final  
> **Tanggal**: 26 Mei 2026  
> **Versi**: 1.0

---

## 1. Latar Belakang

### 1.1 Tentang Proyek
**DimsumStore** adalah aplikasi e-commerce berbasis web untuk menjual produk dimsum secara online langsung ke konsumen akhir (B2C). Proyek ini merupakan **tugas akademik** berskala kecil yang akan dikembangkan dan diluncurkan **secepat mungkin**.

### 1.2 Ruang Lingkup
- **Target pasar**: Konsumen akhir di area **Yogyakarta**
- **Model bisnis**: B2C — penjualan langsung ke pelanggan
- **Pengiriman**: Melalui layanan ojol (GoSend / GrabExpress), area Yogyakarta
- **Pembayaran**: Midtrans (mode **Sandbox** — project dummy untuk tugas)
- **Deployment**: Vercel atau VPS (belum ditentukan), domain belum ditentukan

### 1.3 Tujuan PRD
Dokumen ini berfungsi sebagai **panduan pengembangan fitur baru** di atas codebase yang sudah ada. Fokus utama adalah melengkapi fitur-fitur yang belum terimplementasi agar aplikasi layak digunakan sebagai demo tugas.

---

## 2. Tech Stack

| Layer | Teknologi | Versi |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.4 |
| UI Library | React | 19.2.4 |
| Bahasa | TypeScript | ^5 |
| Styling | Tailwind CSS | ^3.4.19 |
| Database & Auth | Supabase (PostgreSQL + Auth) | supabase-js ^2.105.3 |
| Payment Gateway | Midtrans Snap API | **Sandbox** |
| Icon Library | Lucide React | ^1.14.0 |
| Font | Poppins (via `next/font`) | — |

---

## 3. User Roles

Aplikasi memiliki **dua role** pengguna. Hanya ada **satu akun admin**.

### 3.1 Customer (Pelanggan)
Pengguna umum yang mendaftar untuk membeli dimsum.

### 3.2 Admin (Pengelola Toko)
Satu orang pengelola toko yang mengelola seluruh operasional melalui dashboard admin.

---

## 4. Fitur yang Sudah Diimplementasi

Berikut fitur-fitur yang sudah berjalan di codebase saat ini:

### 4.1 Sisi Customer

| Fitur | Keterangan |
|---|---|
| **Katalog Produk** | Grid produk dengan filter kategori (Kukus, Goreng, Frozen, Minuman), skeleton loading |
| **Detail Produk** | Halaman detail dengan gambar, harga, deskripsi, stok, tingkat pedas |
| **Registrasi** | Daftar via email/password dengan email verification |
| **Login** | Login email/password + Google OAuth, redirect berdasarkan role |
| **Keranjang** | Tambah/hapus item, ubah quantity, pilih/deselect item, ringkasan harga |
| **Checkout** | Konfirmasi pesanan, bayar via Midtrans Snap redirect |
| **Riwayat Pesanan** | Daftar pesanan dengan status badge, tombol bayar untuk status pending |
| **Detail Pesanan** | Daftar item pesanan, rincian pembayaran |

### 4.2 Sisi Admin

| Fitur | Keterangan |
|---|---|
| **Dashboard** | 4 stat cards (total pesanan, pending, total produk, pendapatan), quick links |
| **Kelola Produk** | CRUD produk (nama, deskripsi, harga, kategori, tingkat pedas, stok, foto) |
| **Kelola Pesanan** | Daftar pesanan, filter status, tandai pesanan sebagai "Selesai" |

### 4.3 Backend / API

| Endpoint | Fungsi |
|---|---|
| `GET /api/auth/callback` | OAuth callback + role-based redirect |
| `POST /api/midtrans/charge` | Buat transaksi Midtrans Snap |
| `POST /api/midtrans/webhook` | Terima notifikasi Midtrans, update status order |

### 4.4 Middleware
- Refresh session Supabase pada setiap request
- Proteksi route `/cart`, `/checkout`, `/orders` (wajib login)
- Proteksi `/admin/**` (wajib role admin)
- Redirect user yang sudah login dari `/login` & `/register`

---

## 5. Fitur Baru yang Akan Dikembangkan

### 5.1 Profil Pengguna

**Deskripsi**: Halaman profil di mana pelanggan dapat mengelola data diri.

**Detail**:
- Nama lengkap
- Nomor telepon
- Alamat pengiriman default (tersimpan di database)
- Edit profil

**Route**: `/profile`

---

### 5.2 Alamat Pengiriman

**Deskripsi**: Sistem alamat pengiriman yang tersimpan di profil pengguna namun bisa diubah langsung saat checkout.

**Detail**:
- Alamat default tersimpan di tabel `users` atau tabel terpisah
- Saat checkout, alamat default ditampilkan dan bisa di-edit langsung
- Alamat mencakup: nama penerima, nomor HP, alamat lengkap, kelurahan, kecamatan, kota (Yogyakarta)
- Alamat digunakan untuk perhitungan ongkir dinamis

---

### 5.3 Ongkos Kirim Dinamis

**Deskripsi**: Perhitungan ongkir berdasarkan jarak, menggantikan tarif flat Rp 15.000 yang saat ini di-hardcode.

**Detail**:
- Pengiriman dilakukan melalui **layanan ojol** (GoSend / GrabExpress)
- Ongkir dihitung berdasarkan jarak dari lokasi toko ke alamat pelanggan
- Area pengiriman: **Yogyakarta** saja
- Opsi implementasi:
  - Integrasi API pihak ketiga (Biteship, dll.)
  - Atau perhitungan sederhana berdasarkan jarak (rate per km)

---

### 5.4 Pencarian Produk

**Deskripsi**: Fitur search bar untuk mencari produk berdasarkan nama.

**Detail**:
- Search bar di halaman katalog (beranda)
- Pencarian berdasarkan nama produk
- Bisa dikombinasikan dengan filter kategori yang sudah ada

---

### 5.5 Kategori Produk Dinamis

**Deskripsi**: Kategori produk yang dapat dikelola admin melalui dashboard, menggantikan kategori yang saat ini di-hardcode di `constants.ts`.

**Detail**:
- Tabel baru `categories` di database
- Admin bisa menambah, mengedit, dan menghapus kategori
- Filter kategori di halaman katalog membaca dari database
- Setiap produk terhubung ke kategori via foreign key

---

### 5.6 Varian Produk

**Deskripsi**: Sistem varian produk yang dikelola oleh admin.

**Detail**:
- Admin bisa menambahkan varian ke produk (contoh: ukuran porsi, pilihan isi, paket bundling)
- Setiap varian bisa memiliki harga dan stok tersendiri
- Pelanggan memilih varian saat menambahkan produk ke keranjang

---

### 5.7 Sistem Promo & Voucher

**Deskripsi**: Sistem diskon dan kode promo untuk menarik pelanggan.

**Detail**:
- Admin membuat kode voucher dengan ketentuan:
  - Jenis diskon: persentase atau nominal tetap
  - Minimum pembelian (opsional)
  - Masa berlaku (tanggal mulai & berakhir)
  - Batas penggunaan (jumlah maksimal klaim)
- Pelanggan memasukkan kode voucher saat checkout
- Sistem memvalidasi dan menerapkan diskon secara otomatis
- Contoh tipe promo: diskon persentase, potongan harga, gratis ongkir

---

### 5.8 Review & Rating Produk

**Deskripsi**: Sistem ulasan dan rating dari pelanggan untuk setiap produk.

**Detail**:
- Pelanggan yang sudah membeli (status pesanan `selesai`) bisa memberi rating (1–5 bintang) dan komentar
- Rating rata-rata ditampilkan di kartu produk dan halaman detail
- Daftar ulasan ditampilkan di halaman detail produk
- Satu review per produk per pesanan

---

### 5.9 Pengurangan Stok Otomatis

**Deskripsi**: Stok produk berkurang otomatis saat pesanan berhasil dibayar.

**Detail**:
- Saat webhook Midtrans menerima status `paid`/`settlement`, stok produk yang dipesan dikurangi sesuai quantity
- Jika stok habis (0), produk otomatis ditampilkan sebagai "Stok Habis"
- Pengembalian stok jika pesanan `cancelled` atau `expired`

---

### 5.10 Detail Pesanan di Admin

**Deskripsi**: Admin bisa melihat detail item dari setiap pesanan.

**Detail**:
- Klik pesanan di halaman `/admin/orders` membuka detail pesanan
- Menampilkan: daftar item (nama produk, quantity, harga), data pelanggan (nama, email, alamat), rincian pembayaran
- Opsi untuk mengubah status pesanan

---

### 5.11 Laporan Penjualan

**Deskripsi**: Dashboard laporan penjualan dengan grafik visual.

**Detail**:
- Grafik pendapatan harian / mingguan / bulanan
- Jumlah pesanan per periode
- Produk terlaris
- Ringkasan statistik (total pendapatan, rata-rata nilai pesanan, jumlah pelanggan)

---

### 5.12 Export Data Pesanan

**Deskripsi**: Fitur untuk mengunduh data pesanan dalam format file.

**Detail**:
- Tombol export di halaman admin orders
- Format: CSV atau Excel
- Data yang di-export: ID pesanan, tanggal, pelanggan, item, total, status pembayaran

---

### 5.13 Perbaikan Bug & Teknis

| Bug / Issue | Keterangan |
|---|---|
| **Checkout selektif** | Cart items yang dipilih (checkbox) di halaman keranjang tidak diteruskan ke halaman checkout — checkout mengambil semua item |
| **Reset Password** | Belum ada fitur lupa password / reset password |
| **Error Pages** | Belum ada halaman `error.tsx` dan `not-found.tsx` kustom |
| **Navbar Auth** | Komponen `navbar-auth.tsx` sudah ada tapi tidak digunakan di halaman manapun |

---

## 6. Database Schema

### 6.1 Tabel yang Sudah Ada

#### `users`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID (PK) | = Supabase Auth user ID |
| `email` | text | |
| `role` | text | `'customer'` atau `'admin'` |
| `created_at` | timestamptz | |

#### `products`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID (PK) | |
| `name` | text | |
| `description` | text | |
| `price` | integer | Harga dalam IDR |
| `image_url` | text (nullable) | URL dari Supabase Storage |
| `category` | text | Nama kategori |
| `spicy_level` | integer | 0–5 |
| `stock` | integer | |
| `created_at` | timestamptz | |

#### `carts`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK → users) | 1 cart per user |
| `created_at` | timestamptz | |

#### `cart_items`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID (PK) | |
| `cart_id` | UUID (FK → carts) | |
| `product_id` | UUID (FK → products) | |
| `quantity` | integer | |
| `created_at` | timestamptz | |

#### `orders`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK → users) | |
| `total_price` | integer | Termasuk ongkir |
| `status` | text | `pending` / `paid` / `selesai` / `cancelled` / `expired` |
| `midtrans_order_id` | text (nullable) | Format: `DS-{order_id}` |
| `payment_url` | text (nullable) | Midtrans Snap URL |
| `created_at` | timestamptz | |

#### `order_items`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID (PK) | |
| `order_id` | UUID (FK → orders) | |
| `product_id` | UUID (FK → products) | |
| `quantity` | integer | |
| `price` | integer | Harga saat pembelian (locked) |

### 6.2 Tabel Baru yang Perlu Dibuat

#### `categories` (baru)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID (PK) | |
| `name` | text | Nama kategori (contoh: Kukus, Goreng) |
| `emoji` | text (nullable) | Emoji untuk tampilan (🥟, 🍳, dll) |
| `sort_order` | integer | Urutan tampil |
| `created_at` | timestamptz | |

#### `user_profiles` (baru — atau extend tabel `users`)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID (PK, FK → users) | |
| `full_name` | text (nullable) | Nama lengkap |
| `phone` | text (nullable) | Nomor telepon |
| `address` | text (nullable) | Alamat lengkap |
| `district` | text (nullable) | Kecamatan |
| `sub_district` | text (nullable) | Kelurahan |
| `city` | text | Default: 'Yogyakarta' |
| `latitude` | float (nullable) | Untuk kalkulasi ongkir |
| `longitude` | float (nullable) | Untuk kalkulasi ongkir |

#### `product_variants` (baru)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID (PK) | |
| `product_id` | UUID (FK → products) | |
| `name` | text | Nama varian (contoh: "Porsi Besar") |
| `price_adjustment` | integer | Selisih harga dari harga dasar (+/-) |
| `stock` | integer | |
| `created_at` | timestamptz | |

#### `vouchers` (baru)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID (PK) | |
| `code` | text (unique) | Kode voucher |
| `discount_type` | text | `'percentage'` atau `'fixed'` |
| `discount_value` | integer | Nilai diskon (% atau IDR) |
| `min_purchase` | integer (nullable) | Minimum pembelian |
| `max_uses` | integer (nullable) | Batas total penggunaan |
| `used_count` | integer | Default: 0 |
| `valid_from` | timestamptz | |
| `valid_until` | timestamptz | |
| `is_active` | boolean | Default: true |
| `created_at` | timestamptz | |

#### `reviews` (baru)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK → users) | |
| `product_id` | UUID (FK → products) | |
| `order_id` | UUID (FK → orders) | 1 review per produk per pesanan |
| `rating` | integer | 1–5 |
| `comment` | text (nullable) | |
| `created_at` | timestamptz | |

#### Modifikasi pada `orders` (tambah kolom)
| Kolom Baru | Tipe | Keterangan |
|---|---|---|
| `shipping_cost` | integer | Menggantikan hardcoded 15000 |
| `shipping_address` | text | Alamat pengiriman saat checkout |
| `voucher_id` | UUID (nullable, FK → vouchers) | Voucher yang digunakan |
| `discount_amount` | integer | Nominal diskon |

#### Modifikasi pada `cart_items` (tambah kolom)
| Kolom Baru | Tipe | Keterangan |
|---|---|---|
| `variant_id` | UUID (nullable, FK → product_variants) | Varian yang dipilih |

#### Modifikasi pada `order_items` (tambah kolom)
| Kolom Baru | Tipe | Keterangan |
|---|---|---|
| `variant_id` | UUID (nullable, FK → product_variants) | Varian saat pembelian |
| `variant_name` | text (nullable) | Snapshot nama varian |

---

## 7. User Flow

### 7.1 Flow Pembelian (Customer)

```
Buka Beranda
  → Cari produk (search bar) / Filter kategori
  → Klik produk → Halaman detail
  → Pilih varian (jika ada) & jumlah
  → Tambah ke Keranjang
  → (Jika belum login → redirect ke Login/Register)
  → Buka Keranjang
  → Pilih item yang ingin dibeli (checkbox)
  → Klik "Lanjut ke Pembayaran"
  → Halaman Checkout:
      - Alamat pengiriman (dari profil, bisa diedit)
      - Ongkir dihitung otomatis berdasarkan jarak
      - Input kode voucher (opsional)
      - Ringkasan pembayaran
  → Klik "Bayar Sekarang"
  → Redirect ke Midtrans Snap
  → Pembayaran berhasil → Status "paid"
      - Stok produk berkurang otomatis
  → Customer cek di Riwayat Pesanan
  → Setelah pesanan selesai → Bisa beri review/rating
```

### 7.2 Flow Admin

```
Login sebagai Admin
  → Dashboard (statistik ringkasan)
  → Kelola Kategori: Tambah / Edit / Hapus kategori
  → Kelola Produk: Tambah / Edit / Hapus produk + varian
  → Kelola Voucher: Buat / Edit / Nonaktifkan voucher
  → Kelola Pesanan:
      - Lihat daftar pesanan + filter status
      - Klik pesanan → Detail (item, pelanggan, alamat)
      - Tandai pesanan sebagai "Selesai"
  → Laporan Penjualan: Grafik pendapatan, produk terlaris
  → Export Data: Download pesanan ke CSV/Excel
```

---

## 8. Halaman & Route

### 8.1 Halaman Customer

| Route | Halaman | Status |
|---|---|---|
| `/` | Beranda / Katalog (+ search bar) | ✅ Ada, perlu tambah search |
| `/product/[id]` | Detail Produk (+ review, varian) | ✅ Ada, perlu extend |
| `/login` | Login | ✅ Ada |
| `/register` | Register | ✅ Ada |
| `/profile` | Profil Pengguna | 🆕 Baru |
| `/cart` | Keranjang Belanja | ✅ Ada |
| `/checkout` | Konfirmasi & Pembayaran | ✅ Ada, perlu extend |
| `/orders` | Riwayat Pesanan | ✅ Ada |
| `/orders/[id]` | Detail Pesanan | ✅ Ada |

### 8.2 Halaman Admin

| Route | Halaman | Status |
|---|---|---|
| `/admin` | Dashboard + Statistik | ✅ Ada, perlu extend |
| `/admin/products` | Kelola Produk + Varian | ✅ Ada, perlu extend |
| `/admin/categories` | Kelola Kategori | 🆕 Baru |
| `/admin/orders` | Kelola Pesanan | ✅ Ada, perlu extend |
| `/admin/orders/[id]` | Detail Pesanan Admin | 🆕 Baru |
| `/admin/vouchers` | Kelola Voucher/Promo | 🆕 Baru |
| `/admin/reports` | Laporan Penjualan | 🆕 Baru |

### 8.3 API Routes

| Endpoint | Status |
|---|---|
| `GET /api/auth/callback` | ✅ Ada |
| `POST /api/midtrans/charge` | ✅ Ada, perlu update (ongkir dinamis, voucher) |
| `POST /api/midtrans/webhook` | ✅ Ada, perlu update (auto-reduce stok) |
| `GET /api/export/orders` | 🆕 Baru (export CSV) |

---

## 9. Prioritas Pengembangan

### 🔴 Fase 1 — Critical (Wajib untuk Demo)

| # | Fitur | Keterangan |
|---|---|---|
| 1 | Fix bug checkout selektif | Item yang dipilih di cart harus diteruskan ke checkout |
| 2 | Pengurangan stok otomatis | Stok berkurang saat status order → `paid` |
| 3 | Profil pengguna + alamat | Halaman `/profile` dengan data diri dan alamat |
| 4 | Alamat pengiriman di checkout | Tampilkan alamat dari profil, bisa diedit |
| 5 | Error pages | Halaman `error.tsx` dan `not-found.tsx` |
| 6 | Reset password | Fitur lupa password |
| 7 | Detail pesanan admin | Admin bisa lihat item dalam setiap pesanan |

### 🟡 Fase 2 — Important (Peningkatan Fitur)

| # | Fitur | Keterangan |
|---|---|---|
| 8 | Pencarian produk | Search bar di halaman katalog |
| 9 | Kategori dinamis | Tabel `categories` + CRUD admin |
| 10 | Ongkir dinamis | Kalkulasi berdasarkan jarak (ojol rate) |
| 11 | Varian produk | Sistem varian yang dikelola admin |
| 12 | Sistem voucher/promo | CRUD voucher + validasi saat checkout |

### 🟢 Fase 3 — Nice-to-Have (Polish)

| # | Fitur | Keterangan |
|---|---|---|
| 13 | Review & rating | Sistem ulasan pelanggan per produk |
| 14 | Laporan penjualan | Grafik pendapatan + produk terlaris |
| 15 | Export data CSV | Download data pesanan |
| 16 | Perbaiki navbar auth | Integrasikan komponen yang sudah ada |

---

## 10. Batasan & Catatan

- **Midtrans tetap di mode Sandbox** — project ini adalah dummy untuk tugas akademik
- **Satu admin saja** — tidak perlu multi-admin atau level akses berbeda
- **Tidak ada integrasi WhatsApp** — notifikasi tidak diperlukan
- **Tidak ada minimum order** — pelanggan boleh pesan berapapun
- **Produk frozen tanpa perlakuan khusus** — semua produk diperlakukan sama dalam pengiriman
- **Domain dan hosting belum ditentukan** — rencana Vercel atau VPS
