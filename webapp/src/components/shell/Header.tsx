"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { SCREEN_LABEL } from "@/lib/reference-data";

export function Header({ onMenu, unreadCount }: { onMenu: () => void; unreadCount: number }) {
  const pathname = usePathname();
  const screenId = pathname.split("/").filter(Boolean)[0] ?? "";
  const title = SCREEN_LABEL[screenId] ?? "Kendali Biaya Terpadu";

  return (
    <header className="header">
      <button type="button" className="btn btn-ghost btn-sm menuBtn onlyNarrow" onClick={onMenu} aria-label="Buka menu">
        <Icon name="menu" size={20} />
      </button>
      <button type="button" className="btn btn-ghost btn-sm menuBtn hideNarrow" onClick={onMenu} aria-label="Ciutkan sidebar" style={{ display: "inline-flex" }}>
        <Icon name="menu" size={18} />
      </button>

      <div className="onlyNarrow" style={{ fontWeight: 700, fontSize: 16, flex: 1 }}>{title}</div>

      <div className="headerSearch hideNarrow" style={{ flex: 1, maxWidth: 360 }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)" }}>
            <Icon name="search" size={16} />
          </span>
          <input className="input" placeholder="Cari nomor indeks, vendor, dokumen…" style={{ paddingLeft: 32 }} />
        </div>
      </div>

      <div className="hideNarrow" style={{ flex: 1 }} />

      <Link href="/notifikasi" className="btn btn-ghost btn-sm" style={{ position: "relative" }} aria-label="Notifikasi">
        <Icon name="notif" size={20} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute", top: 2, right: 2, background: "var(--bad)", color: "#fff",
              borderRadius: 100, fontSize: 10, minWidth: 15, height: 15, display: "flex",
              alignItems: "center", justifyContent: "center", padding: "0 3px", fontWeight: 700,
            }}
          >
            {unreadCount}
          </span>
        )}
      </Link>
    </header>
  );
}
