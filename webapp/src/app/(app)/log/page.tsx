import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { idDateTime } from "@/lib/format";

// Log Aktivitas — append-only (§5.4, FR-005). The prototype and PRD are
// explicit that this log "tidak dapat disunting atau dihapus dari
// antarmuka, termasuk oleh Owner. Retensi minimal 10 tahun." This is a
// hard product rule: there is intentionally no actions.ts, no edit/delete
// UI, and no mutation code anywhere in this route.
export default async function LogPage() {
  await requireUser();

  const logs = await prisma.activityLog.findMany({
    include: { user: true, submission: true },
    orderBy: { at: "desc" },
    take: 200,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div className="field-label">§5.4 · FR-005 · append-only</div>
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
          Log Aktivitas
        </h1>
        <p style={{ color: "var(--ink-2)", maxWidth: "64ch", margin: "8px 0 0", fontSize: 15.5, lineHeight: 1.5 }}>
          Tidak dapat disunting atau dihapus dari antarmuka, termasuk oleh Owner. Retensi minimal 10 tahun. Menampilkan 200
          aktivitas terbaru.
        </p>
      </div>

      <section className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Aktivitas</th>
                <th data-extra="">Keterangan</th>
                <th data-extra="">Pengguna</th>
                <th data-extra="">Berkas terkait</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--ink-3)", padding: 24 }}>
                    Belum ada aktivitas.
                  </td>
                </tr>
              )}
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="num">{idDateTime(l.at)}</td>
                  <td>{l.action}</td>
                  <td data-extra="" style={{ color: "var(--ink-2)" }}>
                    {l.note ?? "—"}
                  </td>
                  <td data-extra="" style={{ color: "var(--ink-2)" }}>
                    {l.user.name}
                  </td>
                  <td data-extra="">
                    {l.submission ? (
                      <Link href={`/antrean/${l.submission.id}`} className="btn btn-sm btn-ghost">
                        {l.submission.indexNo}
                      </Link>
                    ) : (
                      "—"
                    )}
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
