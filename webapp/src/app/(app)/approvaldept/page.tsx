import { currentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DeptInboxRow } from "./DeptInboxRow.client";
import { idDateTime } from "@/lib/format";
import { DOC_TYPE_LABEL } from "../_lib/kbt-status";

export default async function ApprovalDeptPage() {
  // This screen is conditionally shown in NAV_PENGAJU (see navForRole), so a
  // role mismatch is a plausible nav misconfiguration, not an attack — show
  // a friendly message instead of throwing requireRole's error.
  const user = await currentUser();

  if (!user || user.role !== "HEAD_DEPARTEMEN") {
    return (
      <div className="card" style={{ maxWidth: 520 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Akses terbatas</h1>
        <p style={{ color: "var(--ink-2)", fontSize: 14.5 }}>
          Persetujuan Departemen hanya dapat dibuka oleh Head Departemen. Hubungi Head Departemen Anda bila berkas perlu diteruskan ke Divisi Budget.
        </p>
      </div>
    );
  }

  const inbox = user.departmentId
    ? await prisma.submission.findMany({
        where: { departmentId: user.departmentId, status: "DEPT_APPROVAL" },
        include: { createdBy: true },
        orderBy: { createdAt: "asc" },
      })
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div className="field-label">Persetujuan internal · sebelum masuk Divisi Budget</div>
        <h1 style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 700, fontSize: 29, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "3px 0 0" }}>
          Persetujuan Departemen
        </h1>
        <p style={{ color: "var(--ink-2)", maxWidth: "62ch", margin: "8px 0 0", fontSize: 15.5, lineHeight: 1.5 }}>
          Berkas dari staf departemen Anda. Yang Anda teruskan masuk ke antrean Divisi Budget dengan nomor indeks yang sama; yang Anda kembalikan tidak pernah sampai ke sana.
        </p>
        <p className="num" style={{ fontSize: 14, color: "var(--ink-3)", marginTop: 10 }}>
          {inbox.length} berkas menunggu keputusan Anda
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {inbox.length === 0 && (
          <div className="card" style={{ color: "var(--ink-3)", textAlign: "center" }}>Tidak ada berkas menunggu persetujuan departemen.</div>
        )}
        {inbox.map((s) => (
          <DeptInboxRow
            key={s.id}
            item={{
              id: s.id,
              indexNo: s.indexNo,
              subject: s.subject,
              docTypeLabel: DOC_TYPE_LABEL[s.docType],
              value: Number(s.value),
              pengajuName: s.createdBy.name,
              uploadedAt: idDateTime(s.createdAt),
              // Submission has no free-text "catatan" field from the pengaju —
              // showing the cost code as brief context instead (simplification,
              // see report).
              note: `Kode anggaran ${s.costCode}.`,
              needsAttention: s.revisionCount > 0,
              tagLevel: s.tagLevel,
            }}
          />
        ))}
      </div>
    </div>
  );
}
