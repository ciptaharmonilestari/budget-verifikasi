import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/StatCard";
import { Tag } from "@/components/ui/Tag";
import { rupiah } from "@/lib/format";
import { STATUS_LABEL, STATUS_HOLDER, DOC_TYPE_LABEL, gateSteps, type GateStepState } from "../_lib/kbt-status";
import type { Submission } from "@/generated/prisma/client";

const DOT_COLOR: Record<GateStepState, string> = {
  done: "var(--ok)",
  current: "var(--accent)",
  fail: "var(--bad)",
  future: "var(--line-2)",
};

function GateDots({ status, currentGate }: { status: Submission["status"]; currentGate: number }) {
  const steps = gateSteps(status, currentGate);
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {steps.map((s, i) => (
        <span
          key={i}
          title={`Gate ${i + 1}`}
          style={{ width: 8, height: 8, borderRadius: "50%", background: DOT_COLOR[s], display: "inline-block" }}
        />
      ))}
    </span>
  );
}

export default async function BerkasPage() {
  const user = await requireUser();

  let submissions = await prisma.submission.findMany({
    where: { createdById: user.id },
    orderBy: { createdAt: "desc" },
  });

  // Demo fallback: if the signed-in account has no submissions of its own
  // (e.g. viewing as a role other than the seeded pengaju b.nugroho), show
  // every seeded submission instead of an empty screen.
  let usingFallback = false;
  if (submissions.length === 0) {
    submissions = await prisma.submission.findMany({ orderBy: { createdAt: "desc" } });
    usingFallback = true;
  }

  const returnedCount = submissions.filter((s) => s.status === "RETURNED").length;
  const runningCount = submissions.filter((s) => !["APPROVED", "REJECTED", "PAID", "VOID", "DRAFT"].includes(s.status)).length;
  const doneCount = submissions.filter((s) => s.status === "PAID" || s.status === "APPROVED").length;
  const totalValue = submissions.reduce((sum, s) => sum + Number(s.value), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div className="field-label">Ruang kerja Pengaju · {user.departmentId ?? "—"}</div>
        <h1 style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 700, fontSize: 29, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "3px 0 0" }}>
          Berkas Saya
        </h1>
        <p style={{ color: "var(--ink-2)", maxWidth: "62ch", margin: "8px 0 0", fontSize: 15.5, lineHeight: 1.5 }}>
          Setiap berkas yang Anda kirim, berikut posisinya di enam gate. Berkas yang dikembalikan menunggu revisi Anda sebelum bisa berjalan lagi.
        </p>
        {usingFallback && (
          <p style={{ fontSize: 13, color: "var(--warn)", marginTop: 8 }}>
            Akun ini belum memiliki berkas sendiri — menampilkan seluruh berkas contoh untuk demo.
          </p>
        )}
      </div>

      <div className="grid3">
        <StatCard label="Total berkas" value={submissions.length} />
        <StatCard label="Sedang berjalan" value={runningCount} />
        <StatCard label="Perlu revisi Anda" value={returnedCount} tone={returnedCount > 0 ? "warn" : "ok"} />
        <StatCard label="Selesai" value={doneCount} tone="ok" />
        <StatCard label="Total nilai" value={rupiah(totalValue)} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {submissions.length === 0 && (
          <div className="card" style={{ color: "var(--ink-3)", textAlign: "center" }}>Belum ada berkas.</div>
        )}
        {submissions.map((f) => (
          <Link
            key={f.id}
            href={`/antrean/${f.id}`}
            className="card"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr) auto",
              gap: 14,
              alignItems: "center",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 9, alignItems: "baseline" }}>
                <span className="num" style={{ fontSize: 14 }}>{f.indexNo}</span>
                <span className="num" style={{ fontSize: 13.5, color: "var(--ink-2)" }}>{DOC_TYPE_LABEL[f.docType]}</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 15, marginTop: 2 }}>{f.subject}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 7 }}>
                <GateDots status={f.status} currentGate={f.currentGate} />
                <span style={{ fontSize: 13.5, color: "var(--ink-2)" }}>
                  {STATUS_LABEL[f.status]} · {STATUS_HOLDER[f.status]}
                  {f.revisionCount > 0 ? ` · revisi ${f.revisionCount}x` : ""}
                </span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="num" style={{ fontSize: 14 }}>{rupiah(Number(f.value))}</div>
              <div style={{ marginTop: 6 }}>
                <Tag level={f.tagLevel}>{STATUS_LABEL[f.status]}</Tag>
              </div>
              {f.status === "RETURNED" && (
                <span
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 8, display: "inline-flex", pointerEvents: "none" }}
                  title="Perbaikan berkas belum tersedia di layar ini"
                >
                  Perbaiki berkas
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
