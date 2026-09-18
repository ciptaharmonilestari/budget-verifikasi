import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/StatCard";
import { Tag } from "@/components/ui/Tag";
import { DataTable } from "@/components/ui/DataTable";
import { rupiah, idDate } from "@/lib/format";
import { KontrakForm } from "./KontrakForm.client";
import type { ContractKind, ContractStatus } from "@/generated/prisma/client";

const KIND_LABEL: Record<ContractKind, string> = {
  KONTRAK: "SPK / Kontrak",
  LOA: "LOA",
  ADENDUM: "Adendum",
  PO: "PO",
};

const STATUS_LABEL: Record<ContractStatus, string> = {
  AKTIF: "Aktif",
  SELESAI: "Selesai",
  DIPUTUS: "Diputus",
  KEDALUWARSA: "Kedaluwarsa",
};

interface ContractRow {
  id: string;
  instrumentNo: string;
  kind: ContractKind;
  vendorName: string;
  ptCode: string;
  projectName: string;
  costCode: string;
  value: number;
  status: ContractStatus;
  tagLevel: "PASS" | "WARN" | "FAIL" | "INFO" | "NA";
}

export default async function RegistriPage() {
  const user = await requireUser();

  const [activeAgg, paidAgg, contracts, vendors, companies] = await Promise.all([
    prisma.contract.aggregate({ where: { status: "AKTIF" }, _count: { _all: true }, _sum: { value: true } }),
    prisma.paymentSchedule.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    prisma.contract.findMany({
      include: { vendor: true, company: true, project: true, paymentSchedules: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
    prisma.company.findMany({ include: { projects: { orderBy: { name: "asc" } } }, orderBy: { name: "asc" } }),
  ]);

  const rows: ContractRow[] = contracts.map((c) => ({
    id: c.id,
    instrumentNo: c.instrumentNo,
    kind: c.kind,
    vendorName: c.vendor.name,
    ptCode: c.company.code,
    projectName: c.project.name,
    costCode: c.costCode,
    value: Number(c.value),
    status: c.status,
    tagLevel: c.tagLevel,
  }));

  const totalActive = activeAgg._count._all;
  const totalValue = Number(activeAgg._sum.value ?? 0);
  const totalPaid = Number(paidAgg._sum.amount ?? 0);

  const projectOptions = companies.flatMap((c) =>
    c.projects.map((p) => ({ id: p.id, label: `${c.code} — ${p.name}` })),
  );
  const vendorOptions = vendors.map((v) => ({ id: v.id, name: v.name }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 12.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)" }}>
          FR-207 · registri komitmen
        </div>
        <h1 style={{ fontSize: 29, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 3 }}>Registri Commitment</h1>
        <p style={{ color: "var(--ink-2)", maxWidth: "66ch", marginTop: 6 }}>
          Kontrak, LOA, adendum dan PO dalam satu daftar. LOA membooking komitmen sejak terbit dan dilepas saat
          kontrak definitif menggantikannya.
        </p>
      </div>

      <section className="card">
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 650, fontSize: 19, letterSpacing: "-0.01em" }}>Kartu Pengawasan Kontrak</div>
            <div style={{ fontSize: 13.5, color: "var(--ink-2)", marginTop: 3 }}>Seluruh PT · seluruh proyek</div>
          </div>
          <div style={{ textAlign: "right", fontSize: 13.5, color: "var(--ink-2)" }}>
            Per tanggal <span className="num">{idDate(new Date())}</span>
          </div>
        </div>
        <div className="grid3" style={{ marginTop: 14 }}>
          <StatCard label="Total kontrak aktif" value={totalActive} />
          <StatCard label="Total nilai komitmen aktif" value={rupiah(totalValue)} />
          <StatCard label="Total terbayar (termin PAID)" value={rupiah(totalPaid)} />
        </div>
      </section>

      <section className="card">
        <div style={{ fontWeight: 650, fontSize: 19, letterSpacing: "-0.01em", marginBottom: 12 }}>Daftar komitmen</div>
        <DataTable
          columns={[
            {
              key: "instrumentNo",
              header: "Instrumen",
              core: true,
              render: (r: ContractRow) => (
                <div>
                  <div className="num" style={{ fontWeight: 600 }}>{r.instrumentNo}</div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{KIND_LABEL[r.kind]}</div>
                </div>
              ),
            },
            { key: "vendor", header: "Vendor", core: true, render: (r) => r.vendorName },
            {
              key: "wbs",
              header: "Proyek / cost code",
              render: (r) => (
                <div>
                  <div>{r.ptCode} — {r.projectName}</div>
                  <div className="num" style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{r.costCode}</div>
                </div>
              ),
            },
            {
              key: "value",
              header: "Nilai",
              align: "right",
              core: true,
              render: (r) => <span className="num">{rupiah(r.value)}</span>,
            },
            { key: "status", header: "Status", render: (r) => STATUS_LABEL[r.status] },
            { key: "tag", header: "Tag", render: (r) => <Tag level={r.tagLevel}>{r.tagLevel}</Tag> },
          ]}
          rows={rows}
          rowKey={(r) => r.id}
          getRowHref={(r) => `/registri/${r.id}`}
          emptyLabel="Belum ada kontrak/komitmen tercatat."
        />
        <p style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 12, maxWidth: "74ch" }}>
          Nilai current sudah termasuk adendum yang disetujui. Adendum yang masih dalam antrean tidak menambah
          komitmen sampai disetujui.
        </p>
      </section>

      {user.flags.master ? (
        <KontrakForm projectOptions={projectOptions} vendorOptions={vendorOptions} />
      ) : (
        <div className="card" style={{ color: "var(--ink-3)", fontSize: 13.5 }}>
          Hanya Owner atau Head of Budget yang dapat menambahkan kontrak/komitmen baru di registri ini.
        </div>
      )}
    </div>
  );
}
