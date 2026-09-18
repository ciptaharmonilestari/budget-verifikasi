/**
 * Default signature-column sets for printed documents, auto-derived from the
 * authority matrix by gate (dc.html: `mSign`/`mSignBayar`, `activeSign`,
 * `signGroups`). The exact literal default arrays weren't recovered from the
 * prototype source during analysis — this is a reasonable reconstruction
 * from `GATE_DETAIL`'s gate owners, applied consistently. Actual columns for
 * a submission are stored on `SignatureColumn` (editable, "+ Tambah kolom
 * tanda tangan"); these defaults only seed that table the first time a
 * document is previewed for a submission with no rows yet.
 */

export interface SignerSeed {
  gate: number; // 0 = pengaju/department level, before Gate 1
  role: string; // e.g. "Diperiksa Oleh,"
  jabatan: string;
}

export const DEFAULT_SIGNERS_GENERIC: SignerSeed[] = [
  { gate: 0, role: "Dibuat Oleh,", jabatan: "Pengaju" },
  { gate: 1, role: "Diketahui Oleh,", jabatan: "Head Departemen" },
  { gate: 3, role: "Diperiksa Oleh,", jabatan: "Divisi Budget" },
  { gate: 4, role: "Disetujui Oleh,", jabatan: "CEO Project" },
  { gate: 5, role: "Disetujui Oleh,", jabatan: "CFO" },
  { gate: 6, role: "Disetujui Oleh,", jabatan: "CEO 1" },
];

export const DEFAULT_SIGNERS_PAYMENT: SignerSeed[] = [
  { gate: 0, role: "Dibuat Oleh,", jabatan: "Pengaju" },
  { gate: 3, role: "Diperiksa Oleh,", jabatan: "Divisi Accounting" },
  { gate: 3, role: "Diperiksa Oleh,", jabatan: "Divisi Budget" },
  { gate: 1, role: "Diketahui Oleh,", jabatan: "Head Departemen" },
  { gate: 4, role: "Disetujui Oleh,", jabatan: "CEO Project" },
  { gate: 5, role: "Disetujui Oleh,", jabatan: "CFO" },
  { gate: 6, role: "Disetujui Oleh,", jabatan: "CEO 1" },
];

export interface SignatureColumnLike {
  gate: number;
  role: string;
  jabatan: string | null;
  name: string | null;
  order: number;
  active: boolean;
}

/** Which signature columns actually print for a submission: gates up to and
 * including its routeGate, in order, excluding any turned off. */
export function activeSignatureColumns<T extends SignatureColumnLike>(columns: T[], routeGate: number): T[] {
  return columns
    .filter((c) => c.active && c.gate <= routeGate)
    .sort((a, b) => a.order - b.order);
}

export interface SignGroup {
  role: string;
  columns: SignatureColumnLike[];
}

/** Merges adjacent columns sharing the same role text into one spanning
 * header cell (dc.html `signGroups`), e.g. two "DIPERIKSA OLEH," entries
 * (Accounting + Budget, both gate 3) print under one shared header. */
export function groupSignatureColumns(columns: SignatureColumnLike[]): SignGroup[] {
  const groups: SignGroup[] = [];
  for (const col of columns) {
    const last = groups[groups.length - 1];
    if (last && last.role === col.role) {
      last.columns.push(col);
    } else {
      groups.push({ role: col.role, columns: [col] });
    }
  }
  return groups;
}
