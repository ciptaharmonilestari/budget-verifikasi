"use client";

import { useState } from "react";
import { resetAllParametersAction } from "./actions";

export function ResetAllButton() {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  if (!confirming) {
    return (
      <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirming(true)}>
        Kembalikan semua ke data contoh
      </button>
    );
  }

  return (
    <div className="card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 10, borderColor: "var(--bad-line)" }}>
      <span style={{ fontSize: 13 }}>Kembalikan seluruh parameter ke data contoh? Semua usulan &amp; riwayat akan hilang.</span>
      <button
        type="button"
        className="btn btn-sm btn-danger"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          await resetAllParametersAction();
          setPending(false);
          setConfirming(false);
        }}
      >
        Ya, kembalikan
      </button>
      <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirming(false)}>Batal</button>
    </div>
  );
}
