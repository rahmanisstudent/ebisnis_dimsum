# Rencana Pelaksanaan — Kanban (Vertical Slices)

> **Referensi**: [PRD.md](./PRD.md)  
> **Metode**: Kanban dengan Vertical Slicing  
> **Tanggal**: 26 Mei 2026

---

## Prinsip Vertical Slicing

Setiap **slice** adalah unit kerja end-to-end yang mencakup **semua layer** sekaligus:

```
┌─────────────────────────────────────────────┐
│              VERTICAL SLICE                 │
│                                             │
│  📐 Database  →  migrasi tabel / kolom      │
│  ⚙️  Backend   →  API route / server action  │
│  🎨 Frontend  →  UI halaman / komponen      │
│  ✅ Testing   →  verifikasi fungsional       │
│                                             │
│  → Bisa di-test & deploy secara independen  │
└─────────────────────────────────────────────┘
```

**WIP Limit**: Maksimal **2 slice** yang boleh In Progress bersamaan.

---

## Kanban Board

### 🔴 LANE 1 — CRITICAL (Wajib untuk Demo)

| # | Slice | Backlog | In Progress | Done |
|---|---|:---:|:---:|:---:|
| S01 | Fix Checkout Selektif | ⬜ | | |
| S02 | Auto-Reduce Stok | ⬜ | | |
| S03 | Error & Not Found Pages | ⬜ | | |
| S04 | Navbar Auth Integration | ⬜ | | |
| S05 | Profil Pengguna + Alamat | ⬜ | | |
| S06 | Alamat di Checkout | ⬜ | | |
| S07 | Reset Password | ⬜ | | |
| S08 | Detail Pesanan Admin | ⬜ | | |

### 🟡 LANE 2 — IMPORTANT (Peningkatan Fitur)

| # | Slice | Backlog | In Progress | Done |
|---|---|:---:|:---:|:---:|
| S09 | Pencarian Produk | ⬜ | | |
| S10 | Kategori Dinamis (DB + Admin) | ⬜ | | |
| S11 | Kategori Dinamis (Katalog) | ⬜ | | |
| S12 | Ongkir Dinamis | ⬜ | | |
| S13 | Varian Produk (DB + Admin) | ⬜ | | |
| S14 | Varian Produk (Customer) | ⬜ | | |
| S15 | Voucher (DB + Admin CRUD) | ⬜ | | |
| S16 | Voucher (Checkout Apply) | ⬜ | | |

### 🟢 LANE 3 — NICE-TO-HAVE (Polish)

| # | Slice | Backlog | In Progress | Done |
|---|---|:---:|:---:|:---:|
| S17 | Review & Rating (DB + Submit) | ⬜ | | |
| S18 | Review & Rating (Display) | ⬜ | | |
| S19 | Laporan Penjualan | ⬜ | | |
| S20 | Export Pesanan CSV | ⬜ | | |

---

## Detail Setiap Vertical Slice

---

### S01 — Fix Checkout Selektif
> **Lane**: 🔴 Critical · **Estimasi**: 0.5 hari · **Dependensi**: Tidak ada

**Masalah**: Halaman cart memiliki checkbox pilih item, tapi checkout mengambil semua cart items.

| Layer | Perubahan |
|---|---|
| Database | — (tidak ada perubahan) |
| Backend | — |
| Frontend | `app/cart/page.tsx`: Kirim `selectedIds` via query param saat navigasi ke checkout |
| Frontend | `app/checkout/page.tsx`: Baca query param, filter hanya item yang dipilih |
| Testing | Pilih 2 dari 4 item di cart → hanya 2 yang muncul di checkout |

---

### S02 — Auto-Reduce Stok
> **Lane**: 🔴 Critical · **Estimasi**: 0.5 hari · **Dependensi**: Tidak ada

**Deskripsi**: Stok produk berkurang otomatis saat pesanan dibayar, dan dikembalikan saat dibatalkan/expired.

| Layer | Perubahan |
|---|---|
| Database | — (kolom `stock` sudah ada di `products`) |
| Backend | `app/api/midtrans/webhook/route.ts`: Setelah status → `paid`, query `order_items` dan kurangi `products.stock`. Setelah `cancelled`/`expired`, kembalikan stok. |
| Frontend | — (tampilan stok sudah otomatis dari data) |
| Testing | Buat order → simulasi webhook `settlement` → cek stok berkurang. Simulasi `cancel` → stok kembali. |

---

### S03 — Error & Not Found Pages
> **Lane**: 🔴 Critical · **Estimasi**: 0.5 hari · **Dependensi**: Tidak ada

**Deskripsi**: Halaman error kustom agar user tidak melihat error mentah Next.js.

| Layer | Perubahan |
|---|---|
| Database | — |
| Backend | — |
| Frontend | Buat `app/error.tsx` (error boundary) |
| Frontend | Buat `app/not-found.tsx` (404 kustom) |
| Frontend | Buat `app/admin/error.tsx` (error admin-themed) |
| Testing | Akses URL yang tidak ada → muncul halaman 404 kustom |

---

### S04 — Navbar Auth Integration
> **Lane**: 🔴 Critical · **Estimasi**: 0.5 hari · **Dependensi**: Tidak ada

**Deskripsi**: Komponen `navbar-auth.tsx` sudah ada tapi belum dipakai. Integrasikan ke navbar utama agar user bisa melihat status login dan tombol logout.

| Layer | Perubahan |
|---|---|
| Database | — |
| Backend | — |
| Frontend | `components/navbar-cart.tsx`: Gabungkan dengan `NavbarAuth` atau buat komposit baru |
| Frontend | `app/page.tsx`, `app/cart/page.tsx`, dll: Pastikan navbar menampilkan auth state |
| Testing | User belum login → tampil "Masuk". Sudah login → tampil email + tombol "Keluar". |

---

### S05 — Profil Pengguna + Alamat
> **Lane**: 🔴 Critical · **Estimasi**: 1.5 hari · **Dependensi**: Tidak ada

**Deskripsi**: Halaman profil baru di mana customer bisa mengisi nama, telepon, dan alamat pengiriman default.

| Layer | Perubahan |
|---|---|
| Database | Buat tabel `user_profiles` (id, full_name, phone, address, district, sub_district, city default 'Yogyakarta', latitude, longitude) |
| Database | Buat trigger: auto-insert `user_profiles` row saat user baru register |
| Backend | Server action / API untuk read & update profil |
| Frontend | Buat `app/profile/page.tsx`: Form edit profil dengan field nama, telepon, alamat |
| Frontend | Proteksi route `/profile` di `middleware.ts` (wajib login) |
| Testing | Register user baru → buka `/profile` → isi data → simpan → refresh → data tetap ada |

---

### S06 — Alamat di Checkout
> **Lane**: 🔴 Critical · **Estimasi**: 1 hari · **Dependensi**: S05

**Deskripsi**: Checkout menampilkan alamat dari profil dan memungkinkan edit langsung. Alamat disimpan ke order saat checkout.

| Layer | Perubahan |
|---|---|
| Database | Tambah kolom `shipping_address` dan `shipping_cost` di tabel `orders` |
| Backend | Update logika create order untuk menyimpan alamat dan ongkir |
| Backend | Update `app/api/midtrans/charge/route.ts`: Gunakan `shipping_cost` dari order, bukan hardcoded 15000 |
| Frontend | `app/checkout/page.tsx`: Fetch profil → tampilkan alamat → form edit inline |
| Frontend | `app/orders/[id]/page.tsx`: Tampilkan alamat pengiriman yang disimpan |
| Testing | Checkout dengan alamat default → alamat tersimpan di order. Edit alamat di checkout → alamat baru yang tersimpan. |

---

### S07 — Reset Password
> **Lane**: 🔴 Critical · **Estimasi**: 0.5 hari · **Dependensi**: Tidak ada

**Deskripsi**: Fitur lupa password menggunakan Supabase Auth `resetPasswordForEmail`.

| Layer | Perubahan |
|---|---|
| Database | — (menggunakan Supabase Auth built-in) |
| Backend | — (Supabase handle email reset) |
| Frontend | Buat `app/reset-password/page.tsx`: Form input email → kirim reset link |
| Frontend | Buat `app/reset-password/update/page.tsx`: Form input password baru (setelah klik link di email) |
| Frontend | `app/login/page.tsx`: Tambah link "Lupa Password?" |
| Testing | Klik lupa password → input email → cek email → klik link → set password baru → login berhasil |

---

### S08 — Detail Pesanan Admin
> **Lane**: 🔴 Critical · **Estimasi**: 1 hari · **Dependensi**: Tidak ada

**Deskripsi**: Halaman detail pesanan di admin panel yang menampilkan item, data pelanggan, dan alamat.

| Layer | Perubahan |
|---|---|
| Database | — (relasi sudah ada, join `order_items` + `products` + `users`) |
| Backend | Server component: fetch order + items + user profile |
| Frontend | Buat `app/admin/orders/[id]/page.tsx`: Detail item, info pelanggan (email, nama, alamat), status, tombol ubah status |
| Frontend | `app/admin/orders/page.tsx`: Tambah link/klik ke detail |
| Testing | Klik pesanan di admin → muncul detail lengkap dengan daftar item dan info pelanggan |

---

### S09 — Pencarian Produk
> **Lane**: 🟡 Important · **Estimasi**: 0.5 hari · **Dependensi**: Tidak ada

**Deskripsi**: Search bar di halaman katalog untuk mencari produk berdasarkan nama.

| Layer | Perubahan |
|---|---|
| Database | — (menggunakan Supabase `.ilike()` atau `.textSearch()`) |
| Backend | `app/page.tsx` (ProductGrid): Tambah parameter `search`, filter query `.ilike('name', '%search%')` |
| Frontend | Buat `components/product-search.tsx`: Input search, update URL search params |
| Frontend | `app/page.tsx`: Baca `searchParams.search`, teruskan ke `ProductGrid` |
| Testing | Ketik "goreng" → hanya produk dengan nama mengandung "goreng" yang tampil |

---

### S10 — Kategori Dinamis (DB + Admin)
> **Lane**: 🟡 Important · **Estimasi**: 1 hari · **Dependensi**: Tidak ada

**Deskripsi**: Tabel kategori di database + halaman CRUD admin.

| Layer | Perubahan |
|---|---|
| Database | Buat tabel `categories` (id, name, emoji, sort_order, created_at) |
| Database | Seed data awal: Kukus, Goreng, Frozen, Minuman |
| Database | (Opsional) Ubah `products.category` text → FK ke `categories.id` |
| Backend | — |
| Frontend | Buat `app/admin/categories/page.tsx`: Tabel + tambah/edit/hapus kategori |
| Frontend | `app/admin/layout.tsx`: Tambah menu "Kategori" di sidebar |
| Testing | Admin tambah kategori "Dessert" → muncul di daftar. Hapus → hilang dari daftar. |

---

### S11 — Kategori Dinamis (Katalog)
> **Lane**: 🟡 Important · **Estimasi**: 0.5 hari · **Dependensi**: S10

**Deskripsi**: Filter kategori di halaman beranda membaca dari database, bukan hardcoded.

| Layer | Perubahan |
|---|---|
| Database | — (sudah ada dari S10) |
| Backend | `app/page.tsx`: Fetch daftar kategori dari tabel `categories` |
| Frontend | `components/category-filter.tsx`: Terima prop categories dari server, bukan dari `constants.ts` |
| Frontend | `app/admin/products/page.tsx`: Dropdown kategori juga baca dari DB |
| Testing | Admin tambah kategori baru → otomatis muncul di filter katalog beranda |

---

### S12 — Ongkir Dinamis
> **Lane**: 🟡 Important · **Estimasi**: 1.5 hari · **Dependensi**: S05, S06

**Deskripsi**: Kalkulasi ongkir berdasarkan jarak dari toko ke alamat pelanggan, menggantikan tarif flat.

| Layer | Perubahan |
|---|---|
| Database | — (kolom `shipping_cost` di `orders` sudah dari S06) |
| Backend | Buat `lib/shipping.ts`: Fungsi hitung jarak (Haversine formula) dari koordinat toko ke koordinat pelanggan → tarif per km (contoh: Rp 2.500/km, min Rp 8.000) |
| Backend | Buat API route `POST /api/shipping/calculate`: Terima lat/lng → return ongkir |
| Frontend | `app/checkout/page.tsx`: Panggil API kalkulasi ongkir saat alamat terisi → update ringkasan harga |
| Frontend | Tampilkan estimasi jarak + harga ongkir |
| Testing | Alamat dekat toko → ongkir murah. Alamat jauh → ongkir lebih mahal. Ongkir tersimpan di order. |

---

### S13 — Varian Produk (DB + Admin)
> **Lane**: 🟡 Important · **Estimasi**: 1.5 hari · **Dependensi**: Tidak ada

**Deskripsi**: Tabel varian di database + admin bisa menambah varian ke produk.

| Layer | Perubahan |
|---|---|
| Database | Buat tabel `product_variants` (id, product_id, name, price_adjustment, stock, created_at) |
| Database | Tambah kolom `variant_id` (nullable) di `cart_items` dan `order_items` |
| Database | Tambah kolom `variant_name` (nullable) di `order_items` |
| Backend | — |
| Frontend | `app/admin/products/page.tsx` (ProductFormModal): Tambah section kelola varian (tambah/hapus varian per produk) |
| Testing | Edit produk → tambah varian "Porsi Besar +Rp5000" → simpan → varian muncul di daftar |

---

### S14 — Varian Produk (Customer)
> **Lane**: 🟡 Important · **Estimasi**: 1 hari · **Dependensi**: S13

**Deskripsi**: Customer bisa memilih varian saat menambahkan produk ke keranjang.

| Layer | Perubahan |
|---|---|
| Database | — (sudah dari S13) |
| Backend | — |
| Frontend | `app/product/[id]/page.tsx`: Fetch varian produk, tampilkan selector varian |
| Frontend | `components/add-to-cart-button.tsx`: Terima selected variant, simpan `variant_id` di `cart_items` |
| Frontend | `app/cart/page.tsx`: Tampilkan nama varian di setiap item, harga menyesuaikan |
| Frontend | `app/checkout/page.tsx`: Snapshot `variant_name` ke `order_items` |
| Testing | Pilih varian "Porsi Besar +Rp5000" → harga di keranjang bertambah Rp5000 → tersimpan di order |

---

### S15 — Voucher (DB + Admin CRUD)
> **Lane**: 🟡 Important · **Estimasi**: 1 hari · **Dependensi**: Tidak ada

**Deskripsi**: Tabel voucher di database + halaman admin untuk membuat dan mengelola voucher.

| Layer | Perubahan |
|---|---|
| Database | Buat tabel `vouchers` (id, code, discount_type, discount_value, min_purchase, max_uses, used_count, valid_from, valid_until, is_active, created_at) |
| Database | Tambah kolom `voucher_id` (nullable) dan `discount_amount` di tabel `orders` |
| Backend | — |
| Frontend | Buat `app/admin/vouchers/page.tsx`: Tabel voucher + form tambah/edit + toggle aktif/nonaktif |
| Frontend | `app/admin/layout.tsx`: Tambah menu "Voucher" di sidebar |
| Testing | Admin buat voucher "DISKON10" 10% → muncul di tabel. Nonaktifkan → status berubah. |

---

### S16 — Voucher (Checkout Apply)
> **Lane**: 🟡 Important · **Estimasi**: 1 hari · **Dependensi**: S15

**Deskripsi**: Customer bisa memasukkan kode voucher saat checkout dan mendapat diskon.

| Layer | Perubahan |
|---|---|
| Database | — (sudah dari S15) |
| Backend | Buat API route `POST /api/vouchers/validate`: Validasi kode (aktif, belum expired, belum melebihi max_uses, min_purchase terpenuhi) → return detail diskon |
| Backend | Update logika create order: simpan `voucher_id`, `discount_amount`, kurangi `total_price` |
| Backend | Update `POST /api/midtrans/charge`: Kirim diskon sebagai line item negatif atau kurangi gross_amount |
| Frontend | `app/checkout/page.tsx`: Input kode voucher → tombol "Gunakan" → panggil API validasi → tampilkan diskon di ringkasan |
| Testing | Masukkan kode valid → diskon diterapkan. Kode invalid/expired → error message. |

---

### S17 — Review & Rating (Submit)
> **Lane**: 🟢 Nice-to-Have · **Estimasi**: 1 hari · **Dependensi**: Tidak ada

**Deskripsi**: Customer bisa memberi review dan rating setelah pesanan selesai.

| Layer | Perubahan |
|---|---|
| Database | Buat tabel `reviews` (id, user_id, product_id, order_id, rating, comment, created_at) |
| Database | Unique constraint: (user_id, product_id, order_id) |
| Backend | — |
| Frontend | `app/orders/[id]/page.tsx`: Jika status `selesai`, tampilkan tombol "Beri Review" per item |
| Frontend | Buat `components/review-form.tsx`: Modal form rating (1–5 bintang) + komentar |
| Testing | Order selesai → klik review → isi rating + komentar → simpan → tidak bisa review ulang untuk produk + order yang sama |

---

### S18 — Review & Rating (Display)
> **Lane**: 🟢 Nice-to-Have · **Estimasi**: 0.5 hari · **Dependensi**: S17

**Deskripsi**: Tampilkan rating rata-rata dan daftar ulasan di halaman produk.

| Layer | Perubahan |
|---|---|
| Database | — (sudah dari S17) |
| Backend | `app/product/[id]/page.tsx`: Fetch reviews + hitung average rating |
| Frontend | `app/product/[id]/page.tsx`: Tampilkan average rating, jumlah review, daftar ulasan |
| Frontend | `components/product-card.tsx`: Tampilkan rating bintang di kartu produk (opsional) |
| Testing | Produk punya 3 review → rating rata-rata ditampilkan → daftar ulasan terlihat |

---

### S19 — Laporan Penjualan
> **Lane**: 🟢 Nice-to-Have · **Estimasi**: 1.5 hari · **Dependensi**: Tidak ada

**Deskripsi**: Dashboard laporan penjualan admin dengan grafik visual.

| Layer | Perubahan |
|---|---|
| Database | — (query aggregate dari `orders` dan `order_items`) |
| Backend | `app/admin/reports/page.tsx` (server component): Query pendapatan per hari/minggu/bulan, produk terlaris, total pelanggan |
| Frontend | Buat `app/admin/reports/page.tsx`: Grafik pendapatan (chart library / SVG), tabel produk terlaris, ringkasan statistik |
| Frontend | `app/admin/layout.tsx`: Tambah menu "Laporan" di sidebar |
| Testing | Buka halaman laporan → grafik dan data sesuai dengan pesanan yang ada di database |

---

### S20 — Export Pesanan CSV
> **Lane**: 🟢 Nice-to-Have · **Estimasi**: 0.5 hari · **Dependensi**: Tidak ada

**Deskripsi**: Admin bisa download data pesanan dalam format CSV.

| Layer | Perubahan |
|---|---|
| Database | — |
| Backend | Buat `app/api/export/orders/route.ts`: Query semua orders + items → format CSV → return sebagai file download |
| Frontend | `app/admin/orders/page.tsx`: Tambah tombol "Export CSV" → panggil API → browser download file |
| Testing | Klik Export → file CSV terdownload → buka di Excel → data sesuai |

---

## Dependency Graph

```
S01 Fix Checkout ─────────────────────────────────────────┐
S02 Auto Stok ────────────────────────────────────────────┤
S03 Error Pages ──────────────────────────────────────────┤ Independen
S04 Navbar Auth ──────────────────────────────────────────┤ (bisa paralel)
S07 Reset Password ──────────────────────────────────────┤
S08 Detail Order Admin ──────────────────────────────────┘

S05 Profil User ──→ S06 Alamat Checkout ──→ S12 Ongkir Dinamis

S10 Kategori (Admin) ──→ S11 Kategori (Katalog)

S13 Varian (Admin) ──→ S14 Varian (Customer)

S15 Voucher (Admin) ──→ S16 Voucher (Checkout)

S17 Review (Submit) ──→ S18 Review (Display)

S09 Pencarian ────────────────────────────────────────────┐
S19 Laporan ──────────────────────────────────────────────┤ Independen
S20 Export CSV ───────────────────────────────────────────┘
```

---

## Urutan Eksekusi yang Disarankan

Berdasarkan dependensi dan prioritas, berikut urutan pengerjaan optimal:

```
Minggu 1 ─ Critical (Paralel batch)
├── S01  Fix Checkout Selektif           (0.5 hari)
├── S02  Auto-Reduce Stok               (0.5 hari)
├── S03  Error & Not Found Pages        (0.5 hari)
├── S04  Navbar Auth Integration        (0.5 hari)
├── S07  Reset Password                 (0.5 hari)
├── S05  Profil Pengguna + Alamat       (1.5 hari) ←── mulai duluan
├── S06  Alamat di Checkout             (1 hari)   ←── setelah S05
└── S08  Detail Pesanan Admin           (1 hari)

Minggu 2 ─ Important
├── S09  Pencarian Produk               (0.5 hari)
├── S10  Kategori Dinamis (Admin)       (1 hari)
├── S11  Kategori Dinamis (Katalog)     (0.5 hari)   ←── setelah S10
├── S12  Ongkir Dinamis                 (1.5 hari)  ←── setelah S06
├── S13  Varian Produk (Admin)          (1.5 hari)
└── S14  Varian Produk (Customer)       (1 hari)    ←── setelah S13

Minggu 3 ─ Important + Nice-to-Have
├── S15  Voucher (Admin CRUD)           (1 hari)
├── S16  Voucher (Checkout Apply)       (1 hari)    ←── setelah S15
├── S17  Review & Rating (Submit)       (1 hari)
├── S18  Review & Rating (Display)      (0.5 hari)  ←── setelah S17
├── S19  Laporan Penjualan              (1.5 hari)
└── S20  Export Pesanan CSV             (0.5 hari)
```

**Total estimasi**: ~16 hari kerja (3 minggu)

---

## Definisi Status Kanban

| Status | Artinya |
|---|---|
| **Backlog** ⬜ | Siap dikerjakan, requirement jelas |
| **In Progress** 🔵 | Sedang dikerjakan (max 2 WIP) |
| **Review** 🟡 | Selesai coding, sedang di-test |
| **Done** ✅ | Tested, merged, bisa di-deploy |

---

## Acceptance Criteria (Per Slice)

Sebuah slice dianggap **Done** jika:
1. ✅ Perubahan database sudah dijalankan (jika ada)
2. ✅ Backend logic berjalan tanpa error
3. ✅ UI berfungsi sesuai deskripsi
4. ✅ Tidak merusak fitur yang sudah ada
5. ✅ Bisa diakses dan diuji di `localhost:3000`
