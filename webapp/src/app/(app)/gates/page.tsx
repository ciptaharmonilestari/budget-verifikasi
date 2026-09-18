import { requireUser } from "@/lib/session";
import { GATE_DETAIL, RETURN_RULES } from "@/lib/reference-data";

export default async function GatesPage() {
  // Read/reference-only screen — every role that has it in nav may view it.
  await requireUser();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div className="field-label">§9.1 · diagram alur induk</div>
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
          Alur Enam Gate
        </h1>
        <p style={{ color: "var(--ink-2)", maxWidth: "66ch", margin: "8px 0 0", fontSize: 15.5, lineHeight: 1.5 }}>
          Dua gate berjalan tanpa manusia hanya pada bagian mesinnya: Gate 1 memutus kelengkapan, dan Gate 3a
          menjalankan rule engine. Sisanya tetap keputusan orang.
        </p>
      </div>

      {/* (a) Flow diagram — flex row of boxes with arrows, wraps on mobile */}
      <section className="card">
        <h2 style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 650, fontSize: 19, letterSpacing: "-0.01em", marginBottom: 14 }}>
          Alur enam gate + Treasury check
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "stretch", gap: 4 }}>
          {GATE_DETAIL.map((g, i) => (
            <div key={g.gate} style={{ display: "flex", alignItems: "stretch", flex: "1 1 auto" }}>
              <div
                style={{
                  flex: "1 1 260px",
                  minWidth: 240,
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius-lg)",
                  padding: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span className="num" style={{ fontSize: 22, fontWeight: 500, color: "var(--gold-ink)" }}>
                    {g.gate === "T" ? "T" : g.gate}
                  </span>
                  <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 650, fontSize: 16 }}>{g.name}</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--accent-2)" }}>
                  {g.owner}
                </div>
                <span
                  className="num"
                  style={{
                    alignSelf: "flex-start",
                    padding: "2px 9px",
                    borderRadius: "var(--radius-pill)",
                    fontSize: 12.5,
                    background: "var(--s2)",
                    border: "1px solid var(--line-2)",
                    color: "var(--ink-3)",
                  }}
                >
                  SLA {g.sla}
                </span>
                <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>{g.desc}</div>
                <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 2 }}>
                  <strong>Keluaran:</strong> {g.output}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--bad)" }}>
                  <strong>Jalur gagal:</strong> {g.failPath}
                </div>
              </div>
              {i < GATE_DETAIL.length - 1 && (
                <div
                  aria-hidden
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 28,
                    flex: "0 0 auto",
                    color: "var(--ink-3)",
                    fontSize: 20,
                  }}
                >
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* (b) 7-step DOC-04 payment flow, derived from the same gate + Treasury data */}
      <section className="card">
        <h2 style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 650, fontSize: 19, letterSpacing: "-0.01em" }}>
          Alur pembayaran project · DOC-04
        </h2>
        <p style={{ color: "var(--ink-2)", maxWidth: "70ch", margin: "6px 0 0", fontSize: 14.5, lineHeight: 1.5 }}>
          Tujuh langkah dari Gate 1 sampai Gate 6, dengan Treasury check masuk setelah Gate 3 khusus untuk berkas
          DOC-04 (pembayaran).
        </p>
        <ol style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16, paddingLeft: 0, listStyle: "none" }}>
          {GATE_DETAIL.map((g, i) => (
            <li
              key={g.gate}
              style={{
                display: "grid",
                gridTemplateColumns: "34px minmax(0, 1fr)",
                gap: 14,
                alignItems: "start",
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius-lg)",
                padding: "14px 16px",
              }}
            >
              <span className="num" style={{ fontSize: 15, color: "var(--gold-ink)", paddingTop: 1 }}>
                {i + 1}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 650, fontSize: 16.5 }}>
                  {g.gate === "T" ? "Treasury check" : `Gate ${g.gate} · ${g.name}`}
                </div>
                <div style={{ fontWeight: 600, fontSize: 12.5, textTransform: "uppercase", letterSpacing: ".15em", color: "var(--accent-2)", marginTop: 3 }}>
                  {g.owner}
                </div>
                <div style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 7 }}>{g.desc}</div>
                <div style={{ fontSize: 13.5, color: "var(--ink-2)", marginTop: 4 }}>Keluaran: {g.output}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* (c) Return / escalation rules */}
      <section className="card">
        <h2 style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 650, fontSize: 19, letterSpacing: "-0.01em" }}>
          Pengembalian &amp; eskalasi
        </h2>
        <ul style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12, maxWidth: "74ch", paddingLeft: 0, listStyle: "none" }}>
          {RETURN_RULES.map((r, i) => (
            <li key={i} style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)", paddingLeft: 14, borderLeft: "2px solid var(--gold)" }}>
              {r}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
