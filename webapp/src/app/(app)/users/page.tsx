import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Tag } from "@/components/ui/Tag";
import { ROLE_LABEL, PERMS } from "@/lib/reference-data";
import { idDateTime } from "@/lib/format";
import { RoleSelect, ActiveToggle, UnlockButton } from "./UserControls.client";

export default async function UsersPage() {
  const user = await requireUser();
  const isOwner = user.role === "OWNER";

  const users = await prisma.user.findMany({
    include: { department: true },
    orderBy: { name: "asc" },
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div className="field-label">FR-002b · FR-006 · master pengguna</div>
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
          User Management
        </h1>
        <p style={{ color: "var(--ink-2)", maxWidth: "66ch", margin: "8px 0 0", fontSize: 15.5, lineHeight: 1.5 }}>
          Hanya Divisi Budget yang punya akun. Peran melekat di sini dan tidak dapat dipilih di layar masuk — hanya Owner
          yang mengubahnya.
        </p>
        {!isOwner && (
          <div
            style={{
              marginTop: 14,
              padding: "9px 12px",
              background: "var(--warn-soft)",
              border: "1px solid var(--warn-line)",
              borderRadius: 5,
              color: "var(--warn)",
              fontSize: 14,
              maxWidth: "66ch",
            }}
          >
            Perubahan peran, status akun dan buka-kunci hanya oleh Owner. Tampilan baca-saja pada peran {user.role}.
          </div>
        )}
      </div>

      <section className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Peran akun</th>
                <th data-extra="">Departemen</th>
                <th data-extra="">Masuk terakhir</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const locked = !!u.lockedUntil && u.lockedUntil.getTime() > Date.now();
                return (
                  <tr key={u.id}>
                    <td>
                      <span style={{ display: "block", fontWeight: 600, fontSize: 14.5 }}>{u.name}</span>
                      <span className="num" style={{ display: "block", fontSize: 13, color: "var(--ink-2)" }}>
                        {u.username}
                      </span>
                    </td>
                    <td>
                      <RoleSelect userId={u.id} role={u.role} isOwner={isOwner} />
                    </td>
                    <td data-extra="" className="num">
                      {u.department ? u.department.code : "—"}
                    </td>
                    <td data-extra="" className="num" style={{ color: "var(--ink-2)" }}>
                      {idDateTime(u.lastLoginAt)}
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                        <Tag level={u.active ? "PASS" : "NA"}>{u.active ? "Aktif" : "Nonaktif"}</Tag>
                        {locked && <Tag level="FAIL">Terkunci</Tag>}
                        <ActiveToggle userId={u.id} active={u.active} isOwner={isOwner} />
                        {locked && <UnlockButton userId={u.id} isOwner={isOwner} />}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div>
        <h2 style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 650, fontSize: 19, letterSpacing: "-0.01em" }}>
          Hak per peran
        </h2>
        <section className="card" style={{ marginTop: 10, padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Kemampuan</th>
                  <th>Peran berwenang</th>
                </tr>
              </thead>
              <tbody>
                {PERMS.map(([capability, roles]) => (
                  <tr key={capability}>
                    <td>{capability}</td>
                    <td style={{ color: roles.length ? "var(--ink-2)" : "var(--ink-3)" }}>
                      {roles.length ? roles.map((r) => ROLE_LABEL[r]).join(", ") : "Tidak ada peran — termasuk Owner"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div
        style={{
          padding: "12px 14px",
          background: "var(--accent-soft)",
          border: "1px solid var(--accent)",
          borderRadius: 5,
          fontSize: 14,
          color: "var(--accent-2)",
          maxWidth: "74ch",
          lineHeight: 1.6,
        }}
      >
        <strong>BR-09</strong> — akun Admin Budget yang menginput satu berkas tidak boleh menjadi Verifikator atas berkas
        yang sama. Sistem menolak, bukan memperingatkan. Penegakan aturan ini (maker-checker) berada di layar Lembar
        Verifikasi, bukan di layar ini.
      </div>
    </div>
  );
}
