"use client";

import { useRouter } from "next/navigation";

export interface ContractOption {
  id: string;
  label: string;
}

/** Navigates via ?contractId= so the breakdown below is server-rendered —
 * same pattern as Posisi Anggaran's PT/proyek picker. */
export function ContractPicker({ contracts, contractId }: { contracts: ContractOption[]; contractId: string }) {
  const router = useRouter();
  return (
    <label style={{ display: "block", maxWidth: 480 }}>
      <span className="field-label">Pilih kontrak (status aktif)</span>
      <select
        className="select"
        value={contractId}
        onChange={(e) => router.push(`/perhitungan?contractId=${e.target.value}`)}
      >
        {contracts.length === 0 && <option value="">Tidak ada kontrak aktif</option>}
        {contracts.map((c) => (
          <option key={c.id} value={c.id}>{c.label}</option>
        ))}
      </select>
    </label>
  );
}
