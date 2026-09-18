/**
 * Pure payment-ladder math — deliberately has NO imports of `@/lib/prisma`
 * or anything else server-only, so client components (e.g. the Lembar
 * Perhitungan scratch calculator) can import it directly without pulling
 * the Prisma client's Node-only runtime into the browser bundle.
 */

export interface TaxCalc {
  rate: number;
  ppn: number;
  pph: number;
  isFinal: boolean;
  basis: string;
}

export interface PaymentLadder {
  gross: number;
  recoupDp: number;
  retensi: number;
  denda: number;
  pph: number;
  ppn: number;
  netto: number;
}

/** Payment ladder for a BAPP/termin claim against a contract (dc.html `pay()`).
 * `overdueDays` = calendar days the BA is past the contract end date without an active adendum. */
export function paymentLadder(opts: {
  contractValue: number;
  priorPct: number;
  cumPct: number;
  dpPct: number;
  retensiPct: number;
  overdueDays: number;
  tax: TaxCalc;
}): PaymentLadder {
  const { contractValue, priorPct, cumPct, dpPct, retensiPct, overdueDays, tax } = opts;
  const gross = (contractValue * (cumPct - priorPct)) / 100;
  const recoupDp = (gross * dpPct) / 100;
  const retensi = (gross * retensiPct) / 100;
  // Sample rate denda "1‰ per hari" (0.1%/day), capped at 5% of contract value (Plafon denda default) —
  // both are Settings parameters but the rate itself is stored as free text (u: TEXT), so the 1‰
  // figure is applied as a fixed default per the sample data rather than parsed live.
  const dendaRaw = overdueDays > 0 ? overdueDays * 0.001 * contractValue : 0;
  const denda = Math.min(dendaRaw, contractValue * 0.05);
  const netto = gross - recoupDp - retensi - denda - tax.pph + tax.ppn;
  return { gross, recoupDp, retensi, denda, pph: tax.pph, ppn: tax.ppn, netto };
}
