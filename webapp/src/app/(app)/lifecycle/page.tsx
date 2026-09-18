import { requireUser } from "@/lib/session";
import { Tag, type TagLevel } from "@/components/ui/Tag";
import { LIFECYCLE } from "@/lib/reference-data";

export default async function LifecyclePage() {
  await requireUser();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div className="field-label">§9.2 · daur hidup status</div>
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
          Status Lifecycle
        </h1>
        <p style={{ color: "var(--ink-2)", maxWidth: "66ch", margin: "8px 0 0", fontSize: 15.5, lineHeight: 1.5 }}>
          Nama teknis dipakai di basis data, label Indonesia di antarmuka. Setiap RETURNED menambah versi berkas
          dengan nomor indeks yang sama.
        </p>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="tbl" style={{ minWidth: 980 }}>
          <thead>
            <tr>
              <th>Nama teknis</th>
              <th data-extra="">Label</th>
              <th data-extra="">Keterangan</th>
              <th data-extra="">Perpindahan berikutnya</th>
              <th data-extra="">Pemicu</th>
            </tr>
          </thead>
          <tbody>
            {LIFECYCLE.map((l) => (
              <tr key={l.tech}>
                <td>
                  <Tag level={l.tag as TagLevel}>{l.tech}</Tag>
                </td>
                <td data-extra="" style={{ fontWeight: 600 }}>
                  {l.label}
                </td>
                <td data-extra="" style={{ color: "var(--ink-2)" }}>
                  {l.meaning}
                </td>
                <td data-extra="" className="num" style={{ color: "var(--ink-2)" }}>
                  {l.next}
                </td>
                <td data-extra="" style={{ color: "var(--ink-2)" }}>
                  {l.trigger}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
