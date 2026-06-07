import React from "react";
import NavbarCart from "@/components/navbar-cart";
import { ChefHat } from "lucide-react";

interface SharedNavbarProps {
  /** Override left-side content (e.g. a back-link) instead of the logo */
  leftSlot?: React.ReactNode;
}

export default function SharedNavbar({ leftSlot }: SharedNavbarProps) {
  return (
    <header style={s.header}>
      <div style={s.inner}>
        {leftSlot ?? (
          <a href="/" style={s.logo}>
            <ChefHat size={22} color="#c0392b" strokeWidth={2.5} />
            <span style={{ fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.4px" }}>
              <span style={{ color: "#c0392b" }}>Dimsum</span>
              <span style={{ color: "#2d2a26" }}>Store</span>
            </span>
          </a>
        )}
        <NavbarCart />
      </div>
    </header>
  );
}

const s: Record<string, React.CSSProperties> = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    backgroundColor: "rgba(255,255,255,0.96)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderBottom: "1px solid #f0e8e4",
    boxShadow: "0 1px 8px rgba(180,60,40,0.06)",
  },
  inner: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 1.5rem",
    height: "62px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1.25rem",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    textDecoration: "none",
    flexShrink: 0,
  },
};
