"use client";

import { useState } from "react";
import { Sidebar } from "@/components/shell/Sidebar";
import { Header } from "@/components/shell/Header";
import type { Role } from "@/generated/prisma/client";

export function AppShell({
  nav,
  userName,
  userRole,
  unreadCount,
  children,
}: {
  nav: string[];
  userName: string;
  userRole: Role;
  unreadCount: number;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);

  function toggleMenu() {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 900px)").matches) {
      setDrawerOpen((v) => !v);
    } else if (window.matchMedia("(min-width: 1181px)").matches) {
      setRailCollapsed((v) => !v);
    }
    // 901–1180px: menu button is hidden by CSS, nothing to toggle there.
  }

  return (
    <div className={`shell${railCollapsed ? " railCollapsed" : ""}`}>
      <div className={`scrim${drawerOpen ? " on" : ""}`} onClick={() => setDrawerOpen(false)} />
      <Sidebar nav={nav} open={drawerOpen} userName={userName} userRole={userRole} onNavigate={() => setDrawerOpen(false)} />
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Header onMenu={toggleMenu} unreadCount={unreadCount} />
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
