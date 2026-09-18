import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { rupiah, idDate } from "@/lib/format";
import { Tag } from "@/components/ui/Tag";
import { DataTable } from "@/components/ui/DataTable";

export default async function PosisiDetailPage({ searchParams }: PageProps<"/posisi/detail">) {
  await requireUser();
  const sp = await searchParams;
  const companyId = typeof sp.pt === "string" ? sp.pt : "";
  const projectId = typeof sp.project === "string" ? sp.project : "";
  const costCode = typeof sp.costCode === "string" ? sp.costCode : "";

  if (!companyId || !projectId || !costCode) {
    return (
      <div className="card">
        <p>Parameter PT, proyek, atau cost code tidak lengkap.</p>
        <Link href="/posisi" className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>Kembali ke Posisi Anggaran</Link>
      </div>
    );
  }

  const [company, project, allocations, contracts, submissions] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId } }),
    prisma.project.findUnique({ where: { id: projectId } }),
    prisma.budgetAllocation.findMany({ where: { companyId, projectId, costCode } }),
    prisma.contract.findMany({ where: { companyId, projectId, costCode }, include: { vendor: true } }),
    prisma.submission.findMany({ where: { companyId, projectId, costCode }, include: { vendor: true } }),
  ]);

  const pagu = allocations.reduce((s, a) => s + Number(a.pagu), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <Link href={`/posisi?pt=${companyId}&project=${projectId}`} className="btn btn-ghost btn-sm">← Kembali ke Posisi Anggaran</Link>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginTop: 10 }}>Rincian — {costCode}</h1>
        <p style={{ color: "var(--ink-2)", marginTop: 4 }}>
          {company?.name} · {project?.name} · pagu item <span className="num">{rupiah(pagu)}</span>
        </p>
      </div>

      <section className="card">
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Alokasi budget</h2>
        <DataTable
          columns={[
            { key: "allocNo", header: "No. alokasi", core: true, render: (a) => <span className="num">{a.allocNo}</span> },
            { key: "name", header: "Nama", core: true, render: (a) => a.name },
            { key: "pagu", header: "Pagu", align: "right", render: (a) => <span className="num">{rupiah(Number(a.pagu))}</span> },
          ]}
          rows={allocations}
          rowKey={(a) => a.id}
          emptyLabel="Tidak ada alokasi untuk cost code ini."
        />
      </section>

      <section className="card">
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Kontrak / commitment</h2>
        <DataTable
          columns={[
            { key: "instrumentNo", header: "Instrumen", core: true, render: (c) => <span className="num">{c.instrumentNo}</span> },
            { key: "vendor", header: "Vendor", core: true, render: (c) => c.vendor.name },
            { key: "value", header: "Nilai", align: "right", render: (c) => <span className="num">{rupiah(Number(c.value))}</span> },
            { key: "status", header: "Status", render: (c) => <Tag level={c.tagLevel}>{c.status}</Tag> },
          ]}
          rows={contracts}
          rowKey={(c) => c.id}
          getRowHref={(c) => `/registri/${c.id}`}
          emptyLabel="Tidak ada kontrak aktif untuk cost code ini."
        />
      </section>

      <section className="card">
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Berkas (realisasi & lainnya)</h2>
        <DataTable
          columns={[
            { key: "indexNo", header: "No. indeks", core: true, render: (s) => <span className="num">{s.indexNo}</span> },
            { key: "subject", header: "Perihal", core: true, render: (s) => s.subject },
            { key: "value", header: "Nilai", align: "right", render: (s) => <span className="num">{rupiah(Number(s.value))}</span> },
            { key: "status", header: "Status", render: (s) => <Tag level={s.tagLevel}>{s.status}</Tag> },
            { key: "date", header: "Tanggal", render: (s) => idDate(s.createdAt) },
          ]}
          rows={submissions}
          rowKey={(s) => s.id}
          emptyLabel="Tidak ada berkas untuk cost code ini."
        />
      </section>
    </div>
  );
}
