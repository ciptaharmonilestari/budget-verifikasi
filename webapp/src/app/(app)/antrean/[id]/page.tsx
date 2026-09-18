import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Tag } from "@/components/ui/Tag";
import { rupiah, idDateTime } from "@/lib/format";
import { STATUS_LABEL, formKindLabel, DOC_TYPE_LABEL } from "../../_lib/kbt-status";

export default async function AntreanDetailPage({ params }: PageProps<"/antrean/[id]">) {
  const { id } = await params;
  // Read-only summary — requireUser() only, no role/write gate on this screen.
  await requireUser();

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { company: true, project: true, department: true, createdBy: true },
  });

  if (!submission) notFound();

  const rows: Array<[string, React.ReactNode]> = [
    ["Subjek", submission.subject],
    ["Jenis", `${formKindLabel(submission.kind)} · ${DOC_TYPE_LABEL[submission.docType]}`],
    ["Nilai diajukan", <span className="num" key="v">{rupiah(Number(submission.value))}</span>],
    ["PT", submission.company.name],
    ["Proyek", submission.project.name],
    ["Departemen", `${submission.department.name} (${submission.department.code})`],
    ["Kode anggaran", submission.costCode],
    ["Status", STATUS_LABEL[submission.status]],
    ["Gate saat ini", `Gate ${submission.currentGate}`],
    ["Tag", <Tag level={submission.tagLevel} key="t">{submission.tagLevel}</Tag>],
    ["Jumlah revisi", String(submission.revisionCount)],
    ["Dibuat oleh", submission.createdBy.name],
    ["Dibuat pada", idDateTime(submission.createdAt)],
    ["Diperbarui pada", idDateTime(submission.updatedAt)],
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <Link href="/antrean" className="btn btn-ghost btn-sm">← Kembali ke Antrean Pengajuan</Link>
      </div>

      <div>
        <div className="field-label">Ringkasan berkas</div>
        <h1
          className="num"
          style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: "-0.02em", margin: "3px 0 0" }}
        >
          {submission.indexNo}
        </h1>
      </div>

      <div className="card">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rows.map(([label, value]) => (
            <div key={label} style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 12, borderBottom: "1px solid var(--line)", paddingBottom: 10 }}>
              <div className="field-label" style={{ marginBottom: 0 }}>{label}</div>
              <div style={{ fontSize: 14.5 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <Link href={`/verifikasi/${submission.id}`} className="btn btn-primary">Buka Lembar Verifikasi</Link>
        <Link href={`/cetak/${submission.id}`} className="btn">Pratinjau &amp; cetak dokumen</Link>
      </div>
    </div>
  );
}
