import { requireUser } from "@/lib/session";

interface Swatch {
  name: string;
  use: string;
}

const COLOR_GROUPS: Array<{ title: string; swatches: Swatch[] }> = [
  {
    title: "Permukaan & tinta",
    swatches: [
      { name: "--ground", use: "Latar halaman" },
      { name: "--surface", use: "Kartu, tabel, sidebar dropdown" },
      { name: "--s2", use: "Latar sekunder, header tabel" },
      { name: "--s3", use: "Latar tersier, hover baris" },
      { name: "--ink", use: "Teks utama" },
      { name: "--ink-2", use: "Teks sekunder" },
      { name: "--ink-3", use: "Label, meta, teks pudar" },
      { name: "--line", use: "Garis pemisah" },
      { name: "--line-2", use: "Garis kontrol/input" },
    ],
  },
  {
    title: "Emas — dekoratif, bukan status",
    swatches: [
      { name: "--gold", use: "Aksen dekoratif, fokus input" },
      { name: "--gold-ink", use: "Ikon aktif, angka gate" },
      { name: "--gold-soft", use: "Hover baris tabel" },
    ],
  },
  {
    title: "Aksen — interaktif, bukan status",
    swatches: [
      { name: "--accent", use: "Tombol utama, info callout" },
      { name: "--accent-2", use: "Tombol utama hover, teks info" },
      { name: "--accent-soft", use: "Latar info callout, tag INFO" },
    ],
  },
  {
    title: "Status — berdiri sendiri",
    swatches: [
      { name: "--ok", use: "Teks status PASS" },
      { name: "--ok-soft", use: "Latar tag PASS" },
      { name: "--ok-line", use: "Garis tag PASS" },
      { name: "--warn", use: "Teks status WARN" },
      { name: "--warn-soft", use: "Latar tag WARN" },
      { name: "--warn-line", use: "Garis tag WARN" },
      { name: "--bad", use: "Teks status FAIL" },
      { name: "--bad-soft", use: "Latar tag FAIL" },
      { name: "--bad-line", use: "Garis tag FAIL" },
    ],
  },
];

const RADII = ["--radius-sm", "--radius-md", "--radius-lg", "--radius-pill"];
const SHADOWS = ["--shadow-card", "--shadow-pop", "--shadow-bar"];

export default async function FondasiPage() {
  await requireUser();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div className="field-label">FR-234 · lembar token</div>
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
          Fondasi Desain
        </h1>
        <p style={{ color: "var(--ink-2)", maxWidth: "64ch", margin: "8px 0 0", fontSize: 15.5, lineHeight: 1.5 }}>
          Emas tidak pernah menjadi tombol atau status. Aksen tidak pernah menjadi status. Tiga warna status berdiri
          sendiri.
        </p>
        <div
          style={{
            marginTop: 14,
            padding: "10px 14px",
            background: "var(--accent-soft)",
            border: "1px solid var(--accent)",
            borderRadius: "var(--radius-sm)",
            fontSize: 13.5,
            color: "var(--accent-2)",
            maxWidth: "70ch",
            lineHeight: 1.55,
          }}
        >
          Halaman ini menampilkan token desain yang benar-benar diterapkan — versi sebelumnya di prototipe tidak
          sinkron dengan CSS asli.
        </div>
      </div>

      {COLOR_GROUPS.map((group) => (
        <section key={group.title} className="card">
          <h2 style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 650, fontSize: 19, letterSpacing: "-0.01em", marginBottom: 12 }}>
            {group.title}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(132px, 1fr))", gap: 10 }}>
            {group.swatches.map((s) => (
              <div key={s.name} style={{ border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--surface)" }}>
                <div style={{ height: 46, background: `var(${s.name})`, borderBottom: "1px solid var(--line)" }} />
                <div style={{ padding: "7px 9px" }}>
                  <div className="num" style={{ fontSize: 13 }}>{s.name}</div>
                  <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 2 }}>{s.use}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="card">
        <h2 style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 650, fontSize: 19, letterSpacing: "-0.01em", marginBottom: 12 }}>
          Radius
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {RADII.map((r) => (
            <div key={r} style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  background: "var(--s2)",
                  border: "1px solid var(--line-2)",
                  borderRadius: `var(${r})`,
                }}
              />
              <div className="num" style={{ fontSize: 12.5, marginTop: 6, color: "var(--ink-2)" }}>{r}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 650, fontSize: 19, letterSpacing: "-0.01em", marginBottom: 12 }}>
          Bayangan
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 28, padding: "8px 0" }}>
          {SHADOWS.map((sh) => (
            <div key={sh} style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 120,
                  height: 72,
                  background: "var(--surface)",
                  borderRadius: "var(--radius-lg)",
                  boxShadow: `var(${sh})`,
                }}
              />
              <div className="num" style={{ fontSize: 12.5, marginTop: 10, color: "var(--ink-2)" }}>{sh}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 650, fontSize: 19, letterSpacing: "-0.01em", marginBottom: 4 }}>
          Huruf
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 10 }}>
          <div>
            <div className="field-label">Judul layar — var(--font-ui) · 700 · 29px</div>
            <div style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 29, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
              Lembar Verifikasi Anggaran
            </div>
          </div>
          <div>
            <div className="field-label">Judul panel — var(--font-ui) · 650 · 19px</div>
            <div style={{ fontFamily: "var(--font-ui)", fontWeight: 650, fontSize: 19, letterSpacing: "-0.01em" }}>Posisi anggaran</div>
          </div>
          <div>
            <div className="field-label">Paragraf — var(--font-ui) · 15px</div>
            <div style={{ fontFamily: "var(--font-ui)", maxWidth: "60ch", fontSize: 15, lineHeight: 1.5, color: "var(--ink-2)" }}>
              Komitmen menahan pagu sejak kontrak atau LOA terbit, bukan sejak dibayar.
            </div>
          </div>
          <div>
            <div className="field-label">Angka — var(--font-num) · tabular-nums</div>
            <div className="num" style={{ fontFamily: "var(--font-num)", fontWeight: 500, fontSize: 18 }}>
              25.680.000.000 · 1.405.000.000 · 70.250.000
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 650, fontSize: 19, letterSpacing: "-0.01em", marginBottom: 12 }}>
          Kendali
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <button type="button" className="btn btn-primary">Tombol utama</button>
          <button type="button" className="btn">Tombol kedua</button>
          <button type="button" className="btn btn-ghost">Tombol ghost</button>
          <button type="button" className="btn btn-danger">Tombol bahaya</button>
          <button type="button" className="btn" disabled>Nonaktif</button>
          <span className="tag tag-PASS">PASS</span>
          <span className="tag tag-WARN">WARN</span>
          <span className="tag tag-FAIL">FAIL</span>
          <span className="tag tag-INFO">INFO</span>
          <span className="tag tag-NA">N/A</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginTop: 18 }}>
          <div className="card" style={{ padding: 14 }}>
            <div className="field-label">.card</div>
            <div style={{ fontSize: 13.5, color: "var(--ink-2)" }}>Kartu standar dengan bayangan --shadow-card.</div>
          </div>
          <div>
            <label className="field-label" htmlFor="fondasi-input-demo">.input</label>
            <input id="fondasi-input-demo" className="input" placeholder="Contoh input" readOnly />
          </div>
        </div>
      </section>
    </div>
  );
}
