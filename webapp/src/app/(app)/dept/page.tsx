import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Tag } from "@/components/ui/Tag";
import { AddDepartmentForm, ToggleActiveButton } from "./DeptControls.client";

export default async function DeptPage() {
  const user = await requireUser();
  const canMaster = user.flags.master;

  const depts = await prisma.department.findMany({
    orderBy: { code: "asc" },
    include: { _count: { select: { users: true } } },
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div className="field-label">FR-002a · master data</div>
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
          Master Departemen
        </h1>
        <p style={{ color: "var(--ink-2)", maxWidth: "64ch", margin: "8px 0 0", fontSize: 15.5, lineHeight: 1.5 }}>
          {depts.length} departemen terdaftar. Departemen yang pernah dipakai pada satu pengajuan tidak bisa dihapus, hanya
          dinonaktifkan.
        </p>
        {canMaster ? (
          <div style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 8 }}>
            Peran {user.role} dapat menambah dan menonaktifkan entri.
          </div>
        ) : (
          <div
            style={{
              marginTop: 12,
              padding: "9px 12px",
              background: "var(--warn-soft)",
              border: "1px solid var(--warn-line)",
              borderRadius: 5,
              color: "var(--warn)",
              fontSize: 14,
              maxWidth: "64ch",
            }}
          >
            Master data hanya dapat diubah Owner dan Head of Budget. Tampilan baca-saja pada peran {user.role}.
          </div>
        )}
      </div>

      {canMaster && (
        <section className="card">
          <h2 style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 650, fontSize: 19, letterSpacing: "-0.01em" }}>
            Tambah departemen
          </h2>
          <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "6px 0 14px", maxWidth: "70ch" }}>
            Kode wajib unik dan menjadi bagian dari nomor indeks berkas yang dibuat departemen ini.
          </p>
          <AddDepartmentForm />
        </section>
      )}

      <section className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Departemen</th>
                <th data-extra="">Akun sistem</th>
                <th data-extra="">Peran di alur</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {depts.map((d) => (
                <tr key={d.id}>
                  <td className="num">{d.code}</td>
                  <td style={{ opacity: d.active ? 1 : 0.55 }}>{d.name}</td>
                  <td data-extra="" className="num">
                    {d._count.users}
                  </td>
                  <td data-extra="" style={{ color: "var(--ink-2)" }}>
                    {d.roleNote ?? "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                      <Tag level={d.active ? "PASS" : "NA"}>{d.active ? "Aktif" : "Nonaktif"}</Tag>
                      {canMaster && <ToggleActiveButton id={d.id} active={d.active} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
