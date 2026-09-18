import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1.1fr 1fr" }} className="loginGrid">
      <div
        style={{
          background: "var(--ink)", color: "#f4efe3", padding: "56px 48px",
          display: "flex", flexDirection: "column", justifyContent: "center", gap: 28,
        }}
      >
        <div>
          <div style={{ fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 700 }}>
            PT Cipta Harmoni Lestari
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 700, marginTop: 10, lineHeight: 1.2 }}>Kendali Biaya Terpadu v1</h1>
          <p style={{ marginTop: 14, fontSize: 15.5, color: "#d9d2c2", maxWidth: 440 }}>
            Satu pintu bagi setiap rupiah yang keluar. Pagu tertahan sejak kontrak terbit, bukan sejak dibayar.
          </p>
        </div>

        <div>
          <div style={{ fontSize: 12.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "#a99f8a", marginBottom: 10 }}>
            Perjalanan satu berkas
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["1", "Pengaju menyusun & mengirim berkas ke antrean"],
              ["2", "Divisi Budget memverifikasi anggaran, pajak & legal"],
              ["3", "CEO Project → CFO → CEO 1 menyetujui berjenjang"],
              ["4", "Dokumen cetak terbit dengan QR & tanda tangan berjenjang"],
            ].map(([n, label]) => (
              <div key={n} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 24, height: 24, borderRadius: 100, background: "var(--gold-ink)", color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  {n}
                </div>
                <div style={{ fontSize: 14, color: "#e7e0d0", paddingTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 28 }}>
          {[
            ["6", "gate berjenjang"],
            ["4", "dokumen cetak A4"],
            ["10", "jenis berkas"],
          ].map(([n, label]) => (
            <div key={label}>
              <div className="num" style={{ fontSize: 26, fontWeight: 700, color: "#fff" }}>{n}</div>
              <div style={{ fontSize: 12.5, color: "#a99f8a" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
