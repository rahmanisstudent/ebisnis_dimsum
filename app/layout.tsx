import type { Metadata } from "next";
import { Poppins } from "next/font/google";
// 1. Impor komponen Script dari Next.js
import Script from "next/script"; 
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: {
    default: "DimsumStore — Dimsum Segar Dikirim ke Pintumu",
    template: "%s | DimsumStore",
  },
  description:
    "Pesan dimsum kukus, goreng, dan frozen premium secara online. Dikirim segar setiap hari ke seluruh kota.",
  keywords: ["dimsum", "pesan dimsum", "dimsum online", "dimsum segar"],
  openGraph: {
    title: "DimsumStore",
    description: "Dimsum Segar Dikirim ke Pintumu",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={poppins.variable}>
      <head>
        {/* 2. Mengunduh skrip utama Google Analytics secara asinkron */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-HRLY00BMVR"
          strategy="afterInteractive"
        />
        
        {/* 3. Inisialisasi konfigurasi dataLayer Google Analytics */}
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-HRLY00BMVR');
          `}
        </Script>
      </head>
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}