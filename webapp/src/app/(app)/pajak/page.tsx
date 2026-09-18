import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { calcTax } from "@/lib/tax";
import { TAX_TX } from "@/lib/reference-data";
import { rupiah, pct, idDateTime } from "@/lib/format";
import { StatCard } from "@/components/ui/StatCard";
import { Tag } from "@/components/ui/Tag";
import { PajakActions } from "./PajakActions.client";

function pkpLabel(txCode: string, pkpStatus: "PKP" | "NON_PKP" | undefined): string {
  if (txCode === "ORANG_PRIBADI") return "Perorangan";
  if (!pkpStatus) return "—";
  return pkpStatus === "PKP" ? "PKP" : "Non-PKP";
}

export default async function PajakPage() {
  const user = await requireUser();
  const canAct = user.flags.taxOwner === true || user.role === "OWNER";

  const submissions = await prisma.submission.findMany({
    where: { taxTxTypeCode: { not: null } },
    include: {
      vendor: true,
      emailApprovalLinks: { where: { gate: 3 }, orderBy: { expiresAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = await Promise.all(
    submissions.map(async (s) => {
      const dpp = Number(s.value);
      const txCode = s.taxTxTypeCode!;
      const entry = TAX_TX.find((t) => t.code === txCode);
      const hasNpwp = !!s.vendor?.npwp;
      const calc = await calcTax(dpp, txCode, hasNpwp);
      const masterRate = entry?.rate ?? 0;
      const proposedRate = s.taxProposedRate !== null ? Number(s.taxProposedRate) : masterRate;
      const mismatch = Math.abs(masterRate - proposedRate) > 0.001;
      const verified = !!s.taxVerifiedAt;
      const emailed = s.emailApprovalLinks.length > 0;
      return { s, dpp, entry, hasNpwp, calc, masterRate, proposedRate, mismatch, verified, emailed };
    })
  );

  const totalDpp = rows.reduce((a, r) => a + r.dpp, 0);
  const stats: Array<{ label: string; value: string; note: string; color?: string }> = [
    { label: "Menunggu verifikasi", value: String(rows.filter((r) => !r.verified).length), note: "berkas dalam antrean pajak" },
    { label: "Tarif tidak sesuai", value: String(rows.filter((r) => r.mismatch).length), note: "usulan berbeda dari tarif master", color: "var(--warn)" },
    { label: "Sudah disahkan", value: String(rows.filter((r) => r.verified).length), note: "tarif master telah disahkan", color: "var(--ok)" },
    { label: "Total DPP antrean", value: rupiah(totalDpp), note: "seluruh berkas di atas" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div className="field-label">Divisi Tax · verifikasi &amp; validasi tarif</div>
        <h1 style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 700, fontSize: 29, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "3px 0 0" }}>
          Panel Pajak
        </h1>
        <p style={{ color: "var(--ink-2)", maxWidth: "70ch", margin: "6px 0 0", fontSize: 15.5, lineHeight: 1.5 }}>
          Setiap berkas membawa status vendor, jenis transaksi, dan tarif yang diusulkan. Tarif master dibandingkan
          dengan usulan; yang berbeda ditandai dan hasil verifikasinya dikirim ke pengaju serta Budget lewat email.
        </p>
      </div>

      <div className="grid3">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={<span style={s.color ? { color: s.color } : undefined}>{s.value}</span>} sub={s.note} />
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.length === 0 && (
          <div className="card" style={{ textAlign: "center", color: "var(--ink-3)", padding: 32 }}>
            Tidak ada berkas menunggu verifikasi pajak.
          </div>
        )}

        {rows.map(({ s, dpp, entry, hasNpwp, calc, masterRate, proposedRate, mismatch, verified, emailed }) => {
          const state: { label: string; level: "PASS" | "WARN" | "INFO" } = verified
            ? { label: "Tarif disahkan", level: "PASS" }
            : mismatch
              ? { label: "Tarif tidak sesuai", level: "WARN" }
              : { label: "Menunggu verifikasi", level: "INFO" };

          return (
            <div key={s.id} className="card">
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 14, alignItems: "start" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 9, alignItems: "baseline" }}>
                    <span className="num" style={{ fontSize: 14 }}>{s.indexNo}</span>
                    <span
                      style={{
                        display: "inline-block", padding: "2px 9px", borderRadius: "var(--radius-pill)",
                        fontSize: 13, background: "var(--s2)", border: "1px solid var(--line-2)", color: "var(--ink-3)",
                      }}
                    >
                      {pkpLabel(s.taxTxTypeCode!, s.vendor?.pkpStatus)}
                    </span>
                  </div>
                  <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 600, fontSize: 16, marginTop: 2 }}>
                    {s.subject}
                  </div>
                  <div style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 3 }}>
                    {s.vendor?.name ?? "Vendor tidak diketahui"} · {entry?.label ?? s.taxTxTypeCode} · {entry?.basis ?? "—"} ({pct(proposedRate)})
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="num" style={{ fontSize: 14 }}>{rupiah(dpp)}</div>
                  <div style={{ marginTop: 6 }}>
                    <Tag level={state.level}>{state.label}</Tag>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "8px 20px",
                  marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)",
                }}
              >
                <div>
                  <div className="field-label">Tarif master</div>
                  <div className="num" style={{ fontSize: 14 }}>{pct(masterRate)}</div>
                </div>
                <div>
                  <div className="field-label">Tarif diusulkan</div>
                  <div className="num" style={{ fontSize: 14, color: mismatch ? "var(--warn)" : undefined }}>{pct(proposedRate)}</div>
                </div>
                <div>
                  <div className="field-label">PPN</div>
                  <div className="num" style={{ fontSize: 14 }}>{rupiah(calc.ppn)}</div>
                </div>
                <div>
                  <div className="field-label">PPh dipotong</div>
                  <div className="num" style={{ fontSize: 14 }}>{rupiah(calc.pph)}</div>
                </div>
              </div>

              <div style={{ fontSize: 13.5, color: "var(--ink-2)", marginTop: 10 }}>
                {mismatch
                  ? `Tarif diusulkan (${pct(proposedRate)}) berbeda dari tarif master (${pct(masterRate)}) — perlu disahkan atau dikoreksi Div Pajak.`
                  : "Tarif diusulkan sesuai tarif master."}
                {!hasNpwp && s.taxTxTypeCode !== "BARANG" && (
                  <> Vendor tanpa NPWP — PPh dipotong 2× tarif normal.</>
                )}
                {verified && s.taxVerifiedAt && (
                  <> Disahkan {idDateTime(s.taxVerifiedAt)}.</>
                )}
              </div>

              {emailed && (
                <div
                  style={{
                    marginTop: 8, padding: "9px 12px", background: "var(--accent-soft)",
                    border: "1px solid var(--accent)", borderRadius: "var(--radius-md)", fontSize: 14, color: "var(--accent-2)",
                  }}
                >
                  Permintaan verifikasi tarif terkirim lewat email ke pengaju dan Divisi Budget.
                </div>
              )}

              {!verified && canAct && <PajakActions submissionId={s.id} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
