import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Tag } from "@/components/ui/Tag";
import { AddCompanyForm, AddProjectForm } from "./PtControls.client";

export default async function PtPage() {
  const user = await requireUser();
  const canMaster = user.flags.master;

  const companies = await prisma.company.findMany({
    orderBy: { code: "asc" },
    include: { projects: { orderBy: { name: "asc" } } },
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div className="field-label">FR-002a · FR-205 · master data</div>
        <h1
          style={{
            fontFamily: "'Source Sans 3', sans-serif",
            fontWeight: 700,
            fontSize: 29,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
            margin: "3px 0 0",
          }}
        >
          Master PT &amp; Proyek
        </h1>
        <p style={{ color: "var(--ink-2)", maxWidth: "66ch", margin: "8px 0 0", fontSize: 15.5, lineHeight: 1.5 }}>
          Setelah satu nomor indeks terbit untuk kombinasi PT + proyek, kode PT dan nama PT terkunci — perubahan ditolak,
          bukan diperingatkan.
        </p>
        {!canMaster && (
          <div
            style={{
              marginTop: 12,
              padding: "9px 12px",
              background: "var(--warn-soft)",
              border: "1px solid var(--warn-line)",
              borderRadius: 5,
              color: "var(--warn)",
              fontSize: 14,
              maxWidth: "66ch",
            }}
          >
            Master data hanya dapat diubah Owner dan Head of Budget. Tampilan baca-saja pada peran {user.role}.
          </div>
        )}
      </div>

      {canMaster && (
        <section className="card">
          <h2 style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 650, fontSize: 19, letterSpacing: "-0.01em" }}>
            Tambah PT &amp; proyek
          </h2>
          <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "6px 0 0", maxWidth: "70ch" }}>
            PT dan proyek yang ada tidak dapat diubah atau dihapus dari sini — hanya penambahan entri baru.
          </p>
          <AddCompanyForm />
          <AddProjectForm companies={companies.map((c) => ({ id: c.id, code: c.code, name: c.name }))} />
        </section>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {companies.map((c) => (
          <section key={c.id} className="card">
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span className="num" style={{ fontWeight: 600, fontSize: 18 }}>
                  {c.code}
                </span>
                <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 650, fontSize: 19, letterSpacing: "-0.01em" }}>
                  {c.name}
                </span>
              </div>
              <Tag level={c.locked ? "INFO" : "PASS"}>{c.locked ? "Terkunci" : "Terbuka"}</Tag>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {c.projects.length === 0 && <span style={{ color: "var(--ink-3)", fontSize: 13.5 }}>Belum ada proyek.</span>}
              {c.projects.map((p) => (
                <div
                  key={p.id}
                  style={{ border: "1px solid var(--line)", borderRadius: 5, padding: "7px 11px", background: "var(--s2)" }}
                >
                  <div className="num" style={{ fontSize: 14 }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 13.5, color: "var(--ink-2)" }}>deret {p.currentSequence}</div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
