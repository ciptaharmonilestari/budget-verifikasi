"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { SCREEN_LABEL, ROLE_LABEL, ROLE_PANEL, PANELS } from "@/lib/reference-data";
import { logoutAction } from "@/lib/auth-actions";
import type { Role } from "@/generated/prisma/client";

export function Sidebar({
  nav,
  open,
  userName,
  userRole,
  onNavigate,
}: {
  nav: string[];
  open: boolean;
  userName: string;
  userRole: Role;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const panel = ROLE_PANEL[userRole];
  const panelInfo = PANELS.find((p) => p.id === panel);

  return (
    <aside className={`sidebar${open ? " navOpen" : ""}`}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px 18px" }}>
        <div
          style={{
            width: 32, height: 32, borderRadius: 8, background: "var(--gold-ink)",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, flex: "none",
          }}
        >
          K
        </div>
        <div className="navText" style={{ overflow: "hidden" }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: "#fff", whiteSpace: "nowrap" }}>Kendali Biaya Terpadu v1</div>
          <div className="navSubtitle" style={{ fontSize: 12, color: "#a99f8a" }}>{panelInfo?.label}</div>
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, overflowY: "auto" }}>
        {nav.map((id) => {
          const href = `/${id}`;
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={id} href={href} onClick={onNavigate} className={`navItem${active ? " active" : ""}`}>
              <Icon name={id} size={20} />
              <span className="navText">{SCREEN_LABEL[id] ?? id}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sessionBlock" style={{ borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 12, marginTop: 8 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#fff" }}>{userName}</div>
        <div style={{ fontSize: 12, color: "#a99f8a", marginBottom: 10 }}>{ROLE_LABEL[userRole]}</div>
        <form action={logoutAction}>
          <button type="submit" className="btn btn-ghost btn-sm" style={{ color: "#d9d2c2", borderColor: "rgba(255,255,255,.2)", width: "100%" }}>
            Keluar
          </button>
        </form>
      </div>
    </aside>
  );
}
