import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NOTIF_RULES } from "@/lib/reference-data";
import { idDateTime } from "@/lib/format";
import { NotifList, type NotifRow } from "./NotifList.client";

export default async function NotifikasiPage() {
  const user = await requireUser();

  const notifs = await prisma.notification.findMany({
    where: {
      OR: [{ toUserId: user.id }, { toRole: user.role }, { AND: [{ toUserId: null }, { toRole: null }] }],
    },
    orderBy: { createdAt: "desc" },
    include: { submission: { select: { indexNo: true } } },
  });

  const rows: NotifRow[] = notifs.map((n) => ({
    id: n.id,
    category: n.category,
    title: n.title,
    body: n.body,
    tagLevel: n.tagLevel,
    createdAt: idDateTime(n.createdAt),
    isRead: !!n.readAt,
    submissionIndexNo: n.submission?.indexNo ?? null,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div className="field-label">FR-011 · §9.6 · notifikasi</div>
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
          Notifications
        </h1>
        <p style={{ color: "var(--ink-2)", maxWidth: "64ch", margin: "8px 0 0", fontSize: 15.5, lineHeight: 1.5 }}>
          Sistem yang memberitahu, bukan orang yang menagih. Empat pemicu: perubahan status, SLA terlampaui, umur
          instrumen, dan masa berlaku tautan.
        </p>
      </div>

      <NotifList initial={rows} />

      <section className="card">
        <h2 style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 650, fontSize: 19, letterSpacing: "-0.01em", marginBottom: 4 }}>
          Aturan pengiriman
        </h2>
        <div style={{ overflowX: "auto", marginTop: 10 }}>
          <table className="tbl" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th>Pemicu</th>
                <th data-extra="">Penerima</th>
                <th data-extra="">Kanal &amp; waktu</th>
              </tr>
            </thead>
            <tbody>
              {NOTIF_RULES.map(([trigger, target, timing]) => (
                <tr key={trigger}>
                  <td style={{ fontWeight: 600 }}>{trigger}</td>
                  <td data-extra="" style={{ color: "var(--ink-2)" }}>
                    {target}
                  </td>
                  <td data-extra="" style={{ color: "var(--ink-2)" }}>
                    {timing}
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
