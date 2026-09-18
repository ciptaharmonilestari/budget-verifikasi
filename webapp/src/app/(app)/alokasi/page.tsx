import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DataTable } from "@/components/ui/DataTable";
import { rupiah, pct, idDateTime } from "@/lib/format";
import { MoveAllocationForm } from "./MoveAllocationForm.client";

const OPEN_STATUSES_EXCLUDED = ["RETURNED", "REJECTED", "VOID"] as const;

interface AllocRow {
  id: string;
  allocNo: string;
  ptCode: string;
  projectName: string;
  costCode: string;
  name: string;
  pagu: number;
  terpakai: number;
}

export default async function AlokasiPage() {
  const user = await requireUser();

  const [allocations, filesWithAlloc, moveLog] = await Promise.all([
    prisma.budgetAllocation.findMany({
      include: { company: true, project: true, submissions: { select: { value: true, status: true } } },
      orderBy: { allocNo: "asc" },
    }),
    prisma.submission.findMany({
      where: { allocationId: { not: null } },
      include: { allocation: true },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    prisma.allocationMoveLog.findMany({
      include: { from: true, to: true, by: true },
      orderBy: { at: "desc" },
      take: 30,
    }),
  ]);

  const rows: AllocRow[] = allocations.map((a) => {
    const terpakai = a.submissions
      .filter((s) => !OPEN_STATUSES_EXCLUDED.includes(s.status as (typeof OPEN_STATUSES_EXCLUDED)[number]))
      .reduce((sum, s) => sum + Number(s.value), 0);
    return {
      id: a.id,
      allocNo: a.allocNo,
      ptCode: a.company.code,
      projectName: a.project.name,
      costCode: a.costCode,
      name: a.name,
      pagu: Number(a.pagu),
      terpakai,
    };
  });

  const fileOptions = filesWithAlloc
    .filter((s) => s.allocationId)
    .map((s) => ({
      id: s.id,
      label: `${s.indexNo} — ${s.subject}`,
      allocationId: s.allocationId as string,
      fromLabel: s.allocation ? `${s.allocation.allocNo} · ${s.allocation.name}` : "—",
    }));
  const allocOptions = allocations.map((a) => ({ id: a.id, label: `${a.allocNo} · ${a.name} (${a.company.code} — ${a.project.name})` }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 12.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)" }}>
          Basis data alokasi · dikelola Divisi Budget
        </div>
        <h1 style={{ fontSize: 29, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 3 }}>Master Alokasi Budget</h1>
        <p style={{ fontSize: 14, color: "var(--ink-2)", margin: "8px 0 0", maxWidth: "82ch" }}>
          Setiap pengajuan biaya wajib menunjuk satu nomor alokasi, dan berkas tidak lolos Gate 3 sebelum alokasinya
          diverifikasi Divisi Budget. Bila pengaju salah mengambil alokasi, Divisi Budget memindahkannya di sini dan
          pemberitahuan otomatis terkirim ke pengaju.
        </p>
      </div>

      <section className="card">
        <div style={{ fontWeight: 650, fontSize: 17, letterSpacing: "-0.01em", marginBottom: 12 }}>Daftar alokasi</div>
        <DataTable
          columns={[
            {
              key: "allocNo",
              header: "No. alokasi",
              core: true,
              render: (r: AllocRow) => <span className="num">{r.allocNo}</span>,
            },
            { key: "pt", header: "PT", render: (r) => r.ptCode },
            { key: "proj", header: "Proyek", render: (r) => r.projectName },
            {
              key: "code",
              header: "Cost code",
              core: true,
              render: (r) => (
                <div>
                  <div className="num" style={{ fontSize: 13 }}>{r.costCode}</div>
                  <div style={{ fontSize: 13, color: "var(--ink-2)" }}>{r.name}</div>
                </div>
              ),
            },
            { key: "pagu", header: "Pagu", align: "right", core: true, render: (r) => <span className="num">{rupiah(r.pagu)}</span> },
            { key: "used", header: "Terpakai", align: "right", render: (r) => <span className="num">{rupiah(r.terpakai)}</span> },
            {
              key: "left",
              header: "Tersisa",
              align: "right",
              core: true,
              render: (r) => {
                const sisa = r.pagu - r.terpakai;
                return <span className="num" style={{ color: sisa < 0 ? "var(--bad)" : "var(--ink)" }}>{rupiah(sisa)}</span>;
              },
            },
            {
              key: "serapan",
              header: "Serapan",
              render: (r) => {
                const p = r.pagu > 0 ? Math.min(100, (r.terpakai / r.pagu) * 100) : 0;
                const over = r.pagu > 0 && r.terpakai > r.pagu;
                return (
                  <div style={{ minWidth: 110 }}>
                    <div className="num" style={{ fontSize: 12.5, color: over ? "var(--bad)" : "var(--ink-2)" }}>
                      {r.pagu > 0 ? pct((r.terpakai / r.pagu) * 100) : "—"}
                    </div>
                    <div style={{ background: "var(--s2)", borderRadius: 100, height: 8, marginTop: 3, overflow: "hidden" }}>
                      <div style={{ width: `${p}%`, background: over ? "var(--bad)" : "var(--gold-ink)", height: "100%", borderRadius: 100 }} />
                    </div>
                  </div>
                );
              },
            },
          ]}
          rows={rows}
          rowKey={(r) => r.id}
          emptyLabel="Belum ada alokasi budget tercatat."
        />
      </section>

      <section className="card">
        <div style={{ fontWeight: 650, fontSize: 17, letterSpacing: "-0.01em" }}>Pindahkan alokasi berkas</div>
        <div style={{ marginTop: 14 }}>
          {user.flags.master ? (
            <MoveAllocationForm files={fileOptions} allocations={allocOptions} />
          ) : (
            <div style={{ color: "var(--ink-3)", fontSize: 13.5 }}>
              Hanya Owner atau Head of Budget yang dapat memindahkan alokasi berkas.
            </div>
          )}
        </div>

        <div style={{ fontWeight: 600, fontSize: 12.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", marginTop: 22 }}>
          Riwayat pemindahan
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 8, borderTop: "1px solid var(--line)" }}>
          {moveLog.length === 0 && (
            <div style={{ padding: "11px 0", fontSize: 13.5, color: "var(--ink-3)" }}>Belum ada pemindahan alokasi tercatat.</div>
          )}
          {moveLog.map((m) => (
            <div key={m.id} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: "8px 16px", padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
              <span>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 600 }}>
                  {m.from.allocNo} → {m.to.allocNo}
                </span>
                <span style={{ display: "block", fontSize: 13, color: "var(--ink-2)", marginTop: 1 }}>
                  {rupiah(Number(m.amount))} · oleh {m.by.name} · {m.reason}
                </span>
              </span>
              <span className="num" style={{ fontSize: 13, color: "var(--ink-3)", whiteSpace: "nowrap" }}>{idDateTime(m.at)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
