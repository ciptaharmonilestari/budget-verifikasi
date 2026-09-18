import Link from "next/link";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Tag } from "@/components/ui/Tag";
import { rupiah, idDateTime } from "@/lib/format";
import { CreateLinkForm } from "./CreateLinkForm.client";
import type { TagLevel } from "@/components/ui/Tag";

const GATE_LABEL: Record<number, string> = { 4: "Gate 4 · CEO Project", 5: "Gate 5 · CFO", 6: "Gate 6 · CEO 1" };

export default async function EmailPage() {
  // Divisi Budget workspace — matches NAV_BUDGET's "email" entry.
  await requireRole("OWNER", "HEAD_BUDGET", "VERIFIKATOR_BUDGET", "ADMIN_BUDGET");

  const [links, eligible] = await Promise.all([
    prisma.emailApprovalLink.findMany({
      where: { usedAt: null },
      include: { submission: true },
      orderBy: { expiresAt: "asc" },
    }),
    prisma.submission.findMany({
      where: { status: { in: ["GATE4_CEO_PROJECT", "GATE5_CFO", "GATE6_CEO1"] } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const now = Date.now();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div className="field-label">§5.5 · FR-002c</div>
        <h1 style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 700, fontSize: 29, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "3px 0 0" }}>
          Review lewat Email
        </h1>
        <p style={{ color: "var(--ink-2)", maxWidth: "64ch", margin: "6px 0 0" }}>
          Pihak di luar Divisi Budget tidak punya akun. Mereka menerima tautan sekali pakai, berlaku 7 hari, terikat satu gate keputusan.
        </p>
      </div>

      <div className="card">
        <div className="field-label">Buat tautan baru</div>
        <div style={{ marginTop: 10 }}>
          <CreateLinkForm
            submissions={eligible.map((s) => ({ id: s.id, indexNo: s.indexNo, subject: s.subject, currentGate: s.currentGate }))}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", background: "var(--s2)", borderBottom: "1px solid var(--line)" }}>
          <span className="field-label" style={{ marginBottom: 0 }}>Tautan terkirim — belum digunakan</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {links.length === 0 && (
            <div style={{ padding: 16, fontSize: 14, color: "var(--ink-2)" }}>Tidak ada tautan yang menunggu.</div>
          )}
          {links.map((l) => {
            const expired = l.expiresAt.getTime() < now;
            const tagLevel: TagLevel = expired ? "FAIL" : "WARN";
            return (
              <div
                key={l.id}
                style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}
              >
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{l.submission.subject}</div>
                  <div className="num" style={{ fontSize: 13.5, color: "var(--ink-2)" }}>{l.submission.indexNo}</div>
                  <div style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 2 }}>
                    {GATE_LABEL[l.gate] ?? `Gate ${l.gate}`} · {rupiah(Number(l.submission.value))} · kedaluwarsa {idDateTime(l.expiresAt)}
                  </div>
                  <Link href={`/email/${l.token}`} className="num" style={{ fontSize: 13, color: "var(--accent-2)" }}>
                    /email/{l.token}
                  </Link>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Tag level={tagLevel}>{expired ? "Kedaluwarsa" : "Menunggu"}</Tag>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
