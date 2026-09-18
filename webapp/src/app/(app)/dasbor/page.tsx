import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/StatCard";
import { Tag } from "@/components/ui/Tag";
import { Icon } from "@/components/Icon";
import { SCREEN_LABEL } from "@/lib/reference-data";
import { rupiah, idDateTime } from "@/lib/format";

const OPEN_STATUSES = [
  "DEPT_APPROVAL", "GATE1_KELENGKAPAN", "GATE2_PARALLEL",
  "GATE3_BUDGET_REVIEW", "TREASURY_CHECK", "GATE4_CEO_PROJECT", "GATE5_CFO", "GATE6_CEO1",
] as const;

export default async function DasborPage() {
  const user = await requireUser();

  const [openCount, myAttentionCount, notifs, allocations, gateCounts, monthly] = await Promise.all([
    prisma.submission.count({ where: { status: { in: [...OPEN_STATUSES] } } }),
    prisma.submission.count({
      where: {
        status: { in: [...OPEN_STATUSES] },
        ...(user.panel === "PENGAJU" ? { createdById: user.id } : {}),
        ...(user.panel === "APPROVER" && user.flags.gate ? { routeGate: user.flags.gate } : {}),
      },
    }),
    prisma.notification.findMany({
      where: { OR: [{ toUserId: user.id }, { toRole: user.role }, { AND: [{ toUserId: null }, { toRole: null }] }] },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.budgetAllocation.findMany({ include: { company: true, project: true, submissions: { select: { value: true, status: true } } }, take: 6 }),
    prisma.submission.groupBy({ by: ["currentGate"], where: { status: { in: [...OPEN_STATUSES] } }, _count: { _all: true } }),
    prisma.submission.aggregate({ _sum: { value: true } }),
  ]);

  const totalDiajukan = Number(monthly._sum.value ?? 0);
  const maxGateCount = Math.max(1, ...gateCounts.map((g) => g._count._all));

  const quickLinks = user.nav.filter((id) => id !== "dasbor").slice(0, 8);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>Selamat datang, {user.name.split(" ")[0]}</h1>
        <p style={{ color: "var(--ink-3)", marginTop: 4, fontSize: 14.5 }}>Ringkasan hari ini · {idDateTime(new Date())}</p>
      </div>

      <div className="grid3">
        <StatCard label="Berkas berjalan (semua gate)" value={openCount} />
        <StatCard label="Perlu perhatian Anda" value={myAttentionCount} tone={myAttentionCount > 0 ? "warn" : "ok"} />
        <StatCard label="Total nilai diajukan" value={rupiah(totalDiajukan)} />
      </div>

      <div className="grid2">
        <section className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Pengingat</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {notifs.length === 0 && <div style={{ color: "var(--ink-3)", fontSize: 13.5 }}>Tidak ada pengingat baru.</div>}
            {notifs.map((n) => (
              <div key={n.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", paddingBottom: 10, borderBottom: "1px solid var(--line)" }}>
                <Tag level={n.tagLevel}>{n.category}</Tag>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{n.title}</div>
                  <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>{n.body}</div>
                </div>
              </div>
            ))}
          </div>
          <Link href="/notifikasi" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }}>Lihat semua notifikasi</Link>
        </section>

        <section className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Akses cepat</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {quickLinks.map((id) => (
              <Link
                key={id}
                href={`/${id}`}
                className="btn"
                style={{ justifyContent: "flex-start", height: 56, flexDirection: "column", alignItems: "flex-start", gap: 4, textAlign: "left" }}
              >
                <Icon name={id} size={18} />
                <span style={{ fontSize: 13 }}>{SCREEN_LABEL[id]}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="grid2">
        <section className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Berkas masuk per gate</h2>
          <p style={{ fontSize: 12.5, color: "var(--ink-3)", marginBottom: 14 }}>Jumlah berkas berjalan menurut gate saat ini</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {gateCounts
              .sort((a, b) => a.currentGate - b.currentGate)
              .map((g) => (
                <div key={g.currentGate} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="num" style={{ width: 56, fontSize: 12.5, color: "var(--ink-3)" }}>Gate {g.currentGate}</div>
                  <div style={{ flex: 1, background: "var(--s2)", borderRadius: 100, height: 10, overflow: "hidden" }}>
                    <div
                      title={`${g._count._all} berkas`}
                      style={{ width: `${(g._count._all / maxGateCount) * 100}%`, background: "var(--accent)", height: "100%", borderRadius: 100 }}
                    />
                  </div>
                  <div className="num" style={{ width: 28, fontSize: 12.5, textAlign: "right" }}>{g._count._all}</div>
                </div>
              ))}
          </div>
        </section>

        <section className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Posisi alokasi budget</h2>
          <p style={{ fontSize: 12.5, color: "var(--ink-3)", marginBottom: 14 }}>Serapan pagu per alokasi</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {allocations.map((a) => {
              const pagu = Number(a.pagu);
              const used = a.submissions
                .filter((s) => s.status !== "RETURNED" && s.status !== "REJECTED" && s.status !== "VOID")
                .reduce((sum, s) => sum + Number(s.value), 0);
              const usedPct = pagu > 0 ? Math.min(100, (used / pagu) * 100) : 0;
              return (
                <div key={a.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                    <span>{a.name} · {a.project.name}</span>
                    <span className="num">{rupiah(pagu)}</span>
                  </div>
                  <div style={{ background: "var(--s2)", borderRadius: 100, height: 8, marginTop: 4, overflow: "hidden" }}>
                    <div title={`${usedPct.toFixed(1)}% terpakai`} style={{ width: `${usedPct}%`, background: "var(--gold-ink)", height: "100%", borderRadius: 100 }} />
                  </div>
                </div>
              );
            })}
          </div>
          <Link href="/posisi" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }}>Buka Posisi Anggaran</Link>
        </section>
      </div>
    </div>
  );
}
