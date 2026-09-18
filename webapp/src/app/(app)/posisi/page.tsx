import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { rupiah, pct, idDate } from "@/lib/format";
import { DataTable } from "@/components/ui/DataTable";
import { PosisiPicker } from "./PosisiPicker.client";

interface CostRow {
  costCode: string;
  name: string;
  pagu: number;
  commit: number;
  real: number;
}

export default async function PosisiPage({ searchParams }: PageProps<"/posisi">) {
  await requireUser();
  const sp = await searchParams;

  const companiesRaw = await prisma.company.findMany({
    include: { projects: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });
  const companies = companiesRaw.filter((c) => c.projects.length > 0);

  const spPt = typeof sp.pt === "string" ? sp.pt : undefined;
  const spProject = typeof sp.project === "string" ? sp.project : undefined;

  let companyId = spPt && companies.some((c) => c.id === spPt) ? spPt : undefined;
  let projectId = spProject;

  if (!companyId) {
    // Default to a PT+project that actually carries budget allocations, so the
    // screen opens on real data instead of an empty picker state.
    const firstAlloc = await prisma.budgetAllocation.findFirst({ orderBy: { allocNo: "asc" } });
    if (firstAlloc && companies.some((c) => c.id === firstAlloc.companyId)) {
      companyId = firstAlloc.companyId;
      projectId = firstAlloc.projectId;
    } else {
      companyId = companies[0]?.id;
    }
  }

  const company = companies.find((c) => c.id === companyId) ?? companies[0];

  if (!company) {
    return (
      <div className="card">
        <p>Belum ada data PT/Proyek di master data.</p>
      </div>
    );
  }

  if (!projectId || !company.projects.some((p) => p.id === projectId)) {
    projectId = company.projects[0]?.id;
  }
  const project = company.projects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Header />
        <div className="card">
          <PosisiPicker
            companies={companies.map((c) => ({ id: c.id, code: c.code, name: c.name, projects: c.projects }))}
            companyId={company.id}
            projectId=""
          />
          <p style={{ marginTop: 16, color: "var(--ink-3)" }}>PT ini belum memiliki proyek terdaftar.</p>
        </div>
      </div>
    );
  }

  const [allocations, contracts, submissions] = await Promise.all([
    prisma.budgetAllocation.findMany({ where: { companyId: company.id, projectId: project.id } }),
    prisma.contract.findMany({ where: { companyId: company.id, projectId: project.id, status: "AKTIF" } }),
    prisma.submission.findMany({
      where: { companyId: company.id, projectId: project.id, status: { in: ["PAID", "APPROVED"] } },
    }),
  ]);

  const byCode = new Map<string, CostRow>();
  const ensure = (costCode: string, fallbackName: string) => {
    let row = byCode.get(costCode);
    if (!row) {
      row = { costCode, name: fallbackName, pagu: 0, commit: 0, real: 0 };
      byCode.set(costCode, row);
    }
    return row;
  };
  for (const a of allocations) {
    const row = ensure(a.costCode, a.name);
    row.pagu += Number(a.pagu);
    row.name = a.name; // BudgetAllocation carries the authoritative label for its cost code
  }
  for (const c of contracts) {
    ensure(c.costCode, c.costCode).commit += Number(c.value);
  }
  for (const s of submissions) {
    ensure(s.costCode, s.costCode).real += Number(s.value);
  }

  const rows = [...byCode.values()].sort((a, b) => b.pagu - a.pagu);
  const totalPagu = rows.reduce((s, r) => s + r.pagu, 0);
  const totalCommit = rows.reduce((s, r) => s + r.commit, 0);
  const totalReal = rows.reduce((s, r) => s + r.real, 0);
  const totalEac = rows.reduce((s, r) => s + Math.max(r.commit, r.real), 0);
  const totalSisa = totalPagu - totalCommit;
  const totalVariance = totalPagu - totalEac;
  const serapanKeseluruhan = totalPagu > 0 ? (totalReal / totalPagu) * 100 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Header />

      <div className="card">
        <PosisiPicker
          companies={companies.map((c) => ({ id: c.id, code: c.code, name: c.name, projects: c.projects }))}
          companyId={company.id}
          projectId={project.id}
        />
        <div style={{ marginTop: 14, fontSize: 13.5, color: "var(--ink-2)" }}>
          Baseline: <span className="num">{idDate(new Date())}</span> · {company.name} · {project.name}
        </div>
      </div>

      <div className="grid3">
        <StatBox label="Total pagu" value={rupiah(totalPagu)} />
        <StatBox label="Total commitment" value={rupiah(totalCommit)} />
        <StatBox label="Total realisasi" value={rupiah(totalReal)} note={`Serapan ${pct(serapanKeseluruhan)}`} />
        <StatBox label="Sisa pagu" value={rupiah(totalSisa)} tone={totalSisa < 0 ? "bad" : undefined} />
        <StatBox label="EAC (estimate at completion)" value={rupiah(totalEac)} />
        <StatBox
          label="Variance thd pagu"
          value={rupiah(totalVariance)}
          tone={totalVariance < 0 ? "bad" : "ok"}
        />
      </div>

      <section className="card">
        <h2 style={{ fontSize: 19, fontWeight: 650, marginBottom: 4 }}>Item cost proyek</h2>
        <p style={{ fontSize: 13.5, color: "var(--ink-2)", marginBottom: 14, maxWidth: "72ch" }}>
          Dikelompokkan berdasarkan cost code yang benar-benar tercatat pada alokasi, kontrak dan realisasi proyek
          ini — bukan struktur 11 item cost baku prototipe (lihat catatan di bawah). Klik satu baris untuk melihat
          rincian kontrak/berkas di baliknya.
        </p>
        <DataTable
          columns={[
            {
              key: "name",
              header: "Item cost",
              core: true,
              render: (r: CostRow) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{r.name}</div>
                  <div className="num" style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{r.costCode}</div>
                </div>
              ),
            },
            {
              key: "share",
              header: "Bobot dari pagu",
              align: "right",
              render: (r: CostRow) => <span className="num">{totalPagu > 0 ? pct((r.pagu / totalPagu) * 100) : "—"}</span>,
            },
            {
              key: "pagu",
              header: "Pagu approved",
              align: "right",
              core: true,
              render: (r: CostRow) => <span className="num">{rupiah(r.pagu)}</span>,
            },
            {
              key: "commit",
              header: "Commitment",
              align: "right",
              render: (r: CostRow) => <span className="num">{rupiah(r.commit)}</span>,
            },
            {
              key: "real",
              header: "Realisasi",
              align: "right",
              render: (r: CostRow) => <span className="num">{rupiah(r.real)}</span>,
            },
            {
              key: "sisa",
              header: "Sisa pagu",
              align: "right",
              render: (r: CostRow) => <span className="num">{rupiah(r.pagu - r.commit)}</span>,
            },
            {
              key: "eac",
              header: "EAC",
              align: "right",
              render: (r: CostRow) => <span className="num">{rupiah(Math.max(r.commit, r.real))}</span>,
            },
            {
              key: "variance",
              header: "Variance",
              align: "right",
              render: (r: CostRow) => {
                const v = r.pagu - Math.max(r.commit, r.real);
                return <span className="num" style={{ color: v < 0 ? "var(--bad)" : "var(--ok)" }}>{rupiah(v)}</span>;
              },
            },
            {
              key: "serapan",
              header: "Serapan",
              render: (r: CostRow) => {
                const realPct = r.pagu > 0 ? Math.min(100, (r.real / r.pagu) * 100) : 0;
                const commitPct = r.pagu > 0 ? Math.min(100, (r.commit / r.pagu) * 100) : 0;
                const extraCommit = Math.max(0, commitPct - realPct);
                return (
                  <div style={{ display: "flex", gap: 1, height: 9, background: "var(--s3)", borderRadius: 100, overflow: "hidden" }}>
                    <div style={{ width: `${realPct}%`, background: "var(--accent)" }} title={`Realisasi ${pct(realPct)}`} />
                    <div style={{ width: `${extraCommit}%`, background: "var(--gold)" }} title={`Commitment ${pct(commitPct)}`} />
                  </div>
                );
              },
            },
          ]}
          rows={rows}
          rowKey={(r) => r.costCode}
          getRowHref={(r) => `/posisi/detail?pt=${company.id}&project=${project.id}&costCode=${encodeURIComponent(r.costCode)}`}
          emptyLabel="Belum ada alokasi, kontrak, atau realisasi tercatat untuk PT/proyek ini."
        />
      </section>

      <div className="card" style={{ fontSize: 13, color: "var(--ink-3)" }}>
        <strong>Catatan data:</strong> Layar ini menghitung pagu, commitment, realisasi, sisa dan EAC langsung dari
        tabel <span className="num">BudgetAllocation</span>, <span className="num">Contract</span> (status AKTIF) dan{" "}
        <span className="num">Submission</span> (status PAID/APPROVED) pada database — bukan angka acak seperti pada
        prototipe dc.html (fungsi <span className="num">seedOf</span>/<span className="num">posData</span>). Karena
        data contoh baru menyeed sebagian kecil alokasi, baris yang tampil hanya mencerminkan cost code yang
        benar-benar ada untuk PT/proyek terpilih.
      </div>
    </div>
  );
}

function Header() {
  return (
    <div>
      <div style={{ fontWeight: 600, fontSize: 12.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)" }}>
        §4.3 · FR-208 · FR-225
      </div>
      <h1 style={{ fontSize: 29, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 3 }}>Posisi Anggaran</h1>
      <p style={{ color: "var(--ink-2)", maxWidth: "64ch", marginTop: 6 }}>
        Pilih PT lalu proyek di dalamnya. Klik satu baris item cost untuk melihat rincian kontrak dan berkas di
        baliknya.
      </p>
    </div>
  );
}

function StatBox({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: "ok" | "bad" }) {
  const color = tone === "ok" ? "var(--ok)" : tone === "bad" ? "var(--bad)" : "var(--ink)";
  return (
    <div className="card">
      <div className="field-label">{label}</div>
      <div className="num" style={{ fontSize: 16, fontWeight: 500, marginTop: 6, color }}>{value}</div>
      {note && <div style={{ fontSize: 12.5, color: "var(--ink-2)", marginTop: 2 }}>{note}</div>}
    </div>
  );
}
