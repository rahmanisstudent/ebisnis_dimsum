import React from "react";
import { ChefHat } from "lucide-react";

const navLinks = [
  { href: "/", label: "Menu" },
  { href: "/cart", label: "Keranjang" },
  { href: "/orders", label: "Pesanan" },
  { href: "/orders/track", label: "Lacak Pesanan" },
];

const legalLinks = [{ href: "/privacy-policy", label: "Kebijakan Privasi" }];

export default function SharedFooter() {
  return (
    <footer style={s.footer}>
      <div style={s.inner}>
        <div style={s.top}>
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <ChefHat size={22} color="#f5a623" strokeWidth={2} />
              <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>
                <span style={{ color: "#fff" }}>Dimsum</span>
                <span style={{ color: "#f5a623" }}>Store</span>
              </span>
            </div>
            <p style={s.tagline}>
              Fresh, hot, and undeniably delicious. Premium dimsum experience.
            </p>
          </div>

          {/* Nav links */}
          <div style={s.linkGroup}>
            <p style={s.linkHeading}>Navigasi</p>
            {navLinks.map(({ href, label }) => (
              <a key={href} href={href} style={s.link}>{label}</a>
            ))}
          </div>

          {/* Legal */}
          <div style={s.linkGroup}>
            <p style={s.linkHeading}>Legal</p>
            {legalLinks.map(({ href, label }) => (
              <a key={href} href={href} style={s.link}>{label}</a>
            ))}
          </div>
        </div>

        <div style={s.divider} />
        <p style={s.copy}>
          © {new Date().getFullYear()} DimsumStore. Semua hak dilindungi.
        </p>
      </div>
    </footer>
  );
}

const s: Record<string, React.CSSProperties> = {
  footer: {
    background: "#1a0f0d",
    marginTop: "4rem",
  },
  inner: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "3rem 1.5rem 2rem",
  },
  top: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "3rem",
  },
  tagline: {
    fontSize: "0.8rem",
    color: "rgba(255,255,255,0.4)",
    maxWidth: "200px",
    lineHeight: 1.6,
  },
  linkGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
  },
  linkHeading: {
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "rgba(255,255,255,0.35)",
    letterSpacing: "1px",
    textTransform: "uppercase" as const,
    marginBottom: "0.25rem",
  },
  link: {
    fontSize: "0.875rem",
    color: "rgba(255,255,255,0.55)",
    textDecoration: "none",
  },
  divider: {
    height: "1px",
    background: "rgba(255,255,255,0.08)",
    margin: "2.25rem 0 1.25rem",
  },
  copy: {
    fontSize: "0.78rem",
    color: "rgba(255,255,255,0.25)",
    textAlign: "center" as const,
  },
};
