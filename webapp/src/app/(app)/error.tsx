"use client";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card" style={{ maxWidth: 480, margin: "40px auto" }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Terjadi kendala</h1>
      <p style={{ fontSize: 14, color: "var(--ink-2)", marginBottom: 16 }}>{error.message || "Terjadi kesalahan yang tidak terduga."}</p>
      <button type="button" className="btn" onClick={reset}>Coba lagi</button>
    </div>
  );
}
