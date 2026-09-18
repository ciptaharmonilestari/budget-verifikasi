import { requireUser } from "@/lib/session";
import { TIERS, AUTH_EXTRA } from "@/lib/reference-data";
import { currentAuthorityTiers } from "@/lib/gate-routing";
import { rupiah } from "@/lib/format";

export default async function AuthorityPage() {
  await requireUser();
  const live = await currentAuthorityTiers();

  const liveRows = [
    { label: "Batas tingkat 1 — Head Dept + Head Budget", value: live.tier1 },
    { label: "Batas tingkat 2 — + CEO Project (Gate 4)", value: live.tier2 },
    { label: "Batas tingkat 3 — Gate 4 → Gate 5 · CFO", value: live.tier3 },
    { label: "Batas tingkat 4 — Gate 5 → Gate 6 · CEO 1", value: live.tier4 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div className="field-label">§11 · authority matrix · T-02</div>
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
          Matriks Kewenangan
        </h1>
        <p style={{ color: "var(--ink-2)", maxWidth: "66ch", margin: "8px 0 0", fontSize: 15.5, lineHeight: 1.5 }}>
          Batas kewenangan yang sebenarnya berlaku diatur lewat register Settings, bukan tabel statis di bawah.
        </p>
      </div>

      <section className="card">
        <h2 style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 650, fontSize: 19, letterSpacing: "-0.01em", marginBottom: 4 }}>
          Nilai kewenangan yang berlaku saat ini
        </h2>
        <p style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 14 }}>Sumber: parameter grup &ldquo;Tingkat kewenangan&rdquo; di Settings</p>
        <div className="grid2">
          {liveRows.map((r) => (
            <div
              key={r.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                padding: "10px 14px",
                background: "var(--s2)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <span style={{ fontSize: 13.5, color: "var(--ink-2)" }}>{r.label}</span>
              <span className="num" style={{ fontWeight: 700, fontSize: 14.5 }}>
                {rupiah(r.value)}
              </span>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              padding: "10px 14px",
              background: "var(--s2)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <span style={{ fontSize: 13.5, color: "var(--ink-2)" }}>Batas RUPS — BoD / Komisaris</span>
            <span className="num" style={{ fontWeight: 700, fontSize: 14.5 }}>
              {live.rups === null ? "Belum diisi" : rupiah(live.rups)}
            </span>
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            padding: "12px 14px",
            background: "var(--accent-soft)",
            border: "1px solid var(--accent)",
            borderRadius: "var(--radius-sm)",
            fontSize: 13.5,
            color: "var(--accent-2)",
            lineHeight: 1.6,
            maxWidth: "78ch",
          }}
        >
          <strong>Kenapa nilainya beda dari tabel referensi di bawah?</strong> Naskah sumber punya dua tabel
          kewenangan yang sedikit berbeda: ambang baku prototipe (Rp 50 jt / 250 jt / 1 M / 5 M, tetap) dan tabel
          §5 PRD yang mengikuti parameter Settings yang bisa diubah. Antrean Keputusan dan rute gate mengikuti
          register Settings sebagai sumber kebenaran tunggal — bukan dua matriks terpisah — sehingga mengubah
          parameter &ldquo;Tingkat kewenangan&rdquo; di Settings benar-benar mengubah rute persetujuan. Tabel di bawah tetap
          ditampilkan sebagai referensi baku/band, bukan nilai yang aktif dipakai mesin rute.
        </div>
      </section>

      <section className="card">
        <h2 style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 650, fontSize: 19, letterSpacing: "-0.01em", marginBottom: 4 }}>
          Tabel referensi band kewenangan
        </h2>
        <p style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 14 }}>Angka pada tabel ini template dan belum disahkan.</p>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl" style={{ minWidth: 640 }}>
            <thead>
              <tr>
                <th>Nilai pengajuan</th>
                <th>Penyetuju</th>
              </tr>
            </thead>
            <tbody>
              {TIERS.map((t) => (
                <tr key={t.band}>
                  <td style={{ fontWeight: 600 }}>{t.band}</td>
                  <td>{t.who}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2 style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 650, fontSize: 19, letterSpacing: "-0.01em" }}>
          Aturan tambahan
        </h2>
        <ul style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12, maxWidth: "74ch", paddingLeft: 0, listStyle: "none" }}>
          {AUTH_EXTRA.map((a, i) => (
            <li key={i} style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)", paddingLeft: 14, borderLeft: "2px solid var(--gold)" }}>
              {a}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
