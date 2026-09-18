"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Tag } from "@/components/ui/Tag";
import { StatCard } from "@/components/ui/StatCard";
import type { TagLevel } from "@/generated/prisma/client";
import { markReadAction } from "./actions";

export type NotifCategory = "SLA" | "STATUS" | "UMUR" | "TAUTAN";

export interface NotifRow {
  id: string;
  category: NotifCategory;
  title: string;
  body: string;
  tagLevel: TagLevel;
  createdAt: string; // pre-formatted (idDateTime)
  isRead: boolean;
  submissionIndexNo: string | null;
}

type TabKey = "ALL" | NotifCategory;

const TAB_ORDER: TabKey[] = ["ALL", "STATUS", "SLA", "UMUR", "TAUTAN"];
const TAB_LABEL: Record<TabKey, string> = { ALL: "Semua", STATUS: "Status", SLA: "SLA", UMUR: "Umur", TAUTAN: "Tautan" };

export function NotifList({ initial }: { initial: NotifRow[] }) {
  const [rows, setRows] = useState(initial);
  const [tab, setTab] = useState<TabKey>("ALL");
  const [, startTransition] = useTransition();

  const unreadCount = rows.filter((r) => !r.isRead).length;
  const readCount = rows.length - unreadCount;
  const shown = tab === "ALL" ? rows : rows.filter((r) => r.category === tab);

  function openNotif(id: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isRead: true } : r)));
    startTransition(() => {
      markReadAction(id).catch(() => {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isRead: false } : r)));
      });
    });
  }

  function markAllRead() {
    const unread = rows.filter((r) => !r.isRead);
    setRows((prev) => prev.map((r) => ({ ...r, isRead: true })));
    for (const r of unread) {
      startTransition(() => {
        markReadAction(r.id).catch(() => {});
      });
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="grid2">
        <StatCard label="Belum dibaca" value={unreadCount} tone={unreadCount > 0 ? "warn" : "ok"} />
        <StatCard label="Sudah dibaca" value={readCount} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        {TAB_ORDER.map((t) => {
          const count = t === "ALL" ? rows.length : rows.filter((r) => r.category === t).length;
          const active = tab === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                padding: "6px 13px",
                borderRadius: "var(--radius-pill)",
                fontSize: 14,
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                cursor: "pointer",
                border: `1px solid ${active ? "var(--accent)" : "var(--line-2)"}`,
                background: active ? "var(--accent)" : "transparent",
                color: active ? "#fff" : "var(--ink)",
                fontWeight: active ? 600 : 400,
              }}
            >
              {TAB_LABEL[t]} ({count})
            </button>
          );
        })}
        <button
          type="button"
          onClick={markAllRead}
          className="btn btn-ghost btn-sm"
          style={{ marginLeft: "auto" }}
          disabled={unreadCount === 0}
        >
          Tandai semua dibaca
        </button>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        {shown.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", fontSize: 14, color: "var(--ink-3)" }}>
            Tidak ada notifikasi pada saringan ini.
          </div>
        )}
        {shown.map((n, i) => (
          <div
            key={n.id}
            role="button"
            tabIndex={0}
            onClick={() => openNotif(n.id)}
            onKeyDown={(e) => (e.key === "Enter" ? openNotif(n.id) : undefined)}
            style={{
              display: "flex",
              gap: 11,
              alignItems: "flex-start",
              width: "100%",
              textAlign: "left",
              padding: "13px 16px",
              background: "transparent",
              borderBottom: i < shown.length - 1 ? "1px solid var(--line)" : "none",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                marginTop: 6,
                flex: "0 0 auto",
                background: n.isRead
                  ? "transparent"
                  : n.tagLevel === "FAIL"
                    ? "var(--bad)"
                    : n.tagLevel === "WARN"
                      ? "var(--warn)"
                      : "var(--accent)",
              }}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: n.isRead ? 400 : 600, color: n.isRead ? "var(--ink-2)" : "var(--ink)" }}>
                {n.title}
              </div>
              <div style={{ fontSize: 13.5, color: "var(--ink-2)", marginTop: 1 }}>{n.body}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginTop: 4 }}>
                <span className="num" style={{ fontSize: 13, color: "var(--ink-3)" }}>{n.createdAt}</span>
                {n.submissionIndexNo && (
                  <>
                    <span className="num" style={{ fontSize: 13, color: "var(--ink-3)" }}>{n.submissionIndexNo}</span>
                    <Link href="/antrean" onClick={(e) => e.stopPropagation()} className="btn btn-ghost btn-sm">
                      Lihat di antrean →
                    </Link>
                  </>
                )}
              </div>
            </div>
            <Tag level={n.tagLevel}>{n.category}</Tag>
          </div>
        ))}
      </div>
    </div>
  );
}
