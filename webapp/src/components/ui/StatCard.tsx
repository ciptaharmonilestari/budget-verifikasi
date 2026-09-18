export function StatCard({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: string; tone?: "ok" | "warn" | "bad" }) {
  const color = tone === "ok" ? "var(--ok)" : tone === "warn" ? "var(--warn)" : tone === "bad" ? "var(--bad)" : "var(--ink)";
  return (
    <div className="card">
      <div className="field-label" style={{ marginBottom: 8 }}>{label}</div>
      <div className="num" style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
