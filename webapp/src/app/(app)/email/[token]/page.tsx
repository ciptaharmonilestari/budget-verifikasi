import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Tag } from "@/components/ui/Tag";
import { rupiah, idDateTime } from "@/lib/format";
import { formKindLabel } from "../../_lib/kbt-status";
import { EmailDecision } from "./EmailDecision.client";
import type { LaneStatus } from "@/generated/prisma/client";

const GATE_LABEL: Record<number, string> = { 4: "Gate 4 · CEO Project", 5: "Gate 5 · CFO", 6: "Gate 6 · CEO 1" };
const CLEARED_LANE_STATUSES: LaneStatus[] = ["TERVERIFIKASI", "TIDAK_DIPERLUKAN"];

export default async function EmailTokenPage({ params }: PageProps<"/email/[token]">) {
  const { token } = await params;
  await requireUser();

  const link = await prisma.emailApprovalLink.findUnique({
    where: { token },
    include: {
      submission: {
        include: { company: true, project: true, department: true, vendor: true, laneClearances: true },
      },
      decidedBy: true,
    },
  });
  if (!link) notFound();

  const submission = link.submission;
  const expired = link.expiresAt.getTime() < Date.now();
  const laneBlocked = submission.laneClearances.some((l) => !CLEARED_LANE_STATUSES.includes(l.status));
  const alreadyUsed = !!link.usedAt;
  const canDecide = !alreadyUsed && !expired;

  const summary: Array<[string, React.ReactNode]> = [
    ["Nomor indeks", submission.indexNo],
    ["Jenis", formKindLabel(submission.kind)],
    ["Nilai diajukan", rupiah(Number(submission.value))],
    ["PT / Proyek", `${submission.company.name} · ${submission.project.name}`],
    ["Departemen", submission.department.name],
    ["Vendor", submission.vendor?.name ?? "—"],
    ["Gate tautan ini", GATE_LABEL[link.gate] ?? `Gate ${link.gate}`],
    ["Kedaluwarsa", idDateTime(link.expiresAt)],
  ];

  return (
    <div style={{ maxWidth: 520, display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div className="field-label">Yang dilihat penerima tautan</div>
        <h1 style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 700, fontSize: 24, letterSpacing: "-0.02em", margin: "3px 0 0" }}>
          Persetujuan pembayaran
        </h1>
      </div>

      <div className="card">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {summary.map(([label, value]) => (
            <div key={label as string} style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", paddingBottom: 4, borderBottom: "1px solid var(--line)", fontSize: 14 }}>
              <span style={{ color: "var(--ink-3)" }}>{label}</span>
              <span className="num" style={{ textAlign: "right" }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          {alreadyUsed ? (
            <div style={{ padding: "10px 12px", background: "var(--s2)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 13.5 }}>
              Tautan ini sudah dipakai — keputusan: <Tag level={link.decision === "APPROVED" ? "PASS" : "FAIL"}>{link.decision ?? "—"}</Tag>
              {link.decidedBy && <> oleh {link.decidedBy.name}</>}.
            </div>
          ) : expired ? (
            <div style={{ padding: "10px 12px", background: "var(--bad-soft)", border: "1px solid var(--bad-line)", borderRadius: 8, fontSize: 13.5, color: "var(--bad)" }}>
              Tautan ini sudah kedaluwarsa.
            </div>
          ) : (
            <EmailDecision token={token} laneBlocked={laneBlocked} />
          )}
          {canDecide && submission.status !== "GATE4_CEO_PROJECT" && submission.status !== "GATE5_CFO" && submission.status !== "GATE6_CEO1" && (
            <p style={{ fontSize: 13, color: "var(--warn)", marginTop: 8 }}>
              Catatan: status berkas sudah berubah — server akan menolak keputusan bila tautan ini tidak lagi cocok dengan gate saat ini.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
