import { prisma } from "@/lib/prisma";
import { PARAM_DEFS, parseParamNumber } from "@/lib/parameters";
import { TAX_TX, pph21 } from "@/lib/reference-data";
import { paymentLadder, type TaxCalc as TaxCalcType, type PaymentLadder as PaymentLadderType } from "@/lib/payment-ladder";

export { paymentLadder };
export type PaymentLadder = PaymentLadderType;

const LIVE_TAX_PARAM_LABELS: Record<string, string> = {
  PPN: "PPN",
  JASA_KONSTRUKSI_KECIL: "PPh final jasa konstruksi — SBU K1",
  JASA_KONSTRUKSI_BESAR: "PPh final jasa konstruksi — SBU K2",
  JASA_LAIN: "PPh 23 jasa lain",
};

/** Reads the live (Settings-editable) rate for the 4 tax parameters the
 * Div Pajak group owns; other TAX_TX codes fall back to the static table
 * since only these four are in scope of the Settings register (PRD §7.6). */
export async function liveTaxRate(txCode: string): Promise<number> {
  const paramLabel = LIVE_TAX_PARAM_LABELS[txCode];
  const staticEntry = TAX_TX.find((t) => t.code === txCode);
  if (!paramLabel) return staticEntry?.rate ?? 0;

  const def = PARAM_DEFS.find((p) => p.group === "TARIF_PAJAK" && p.label === paramLabel);
  if (!def) return staticEntry?.rate ?? 0;
  const row = await prisma.parameterValue.findUnique({ where: { parameterId: def.id } });
  const n = row ? parseParamNumber(row.currentValue) : null;
  return n ?? staticEntry?.rate ?? 0;
}

export type TaxCalc = TaxCalcType;

/** PPh withholding doubles when the vendor has no NPWP (dc.html: `npwpRate = baseRate; else baseRate*2`). */
export async function calcTax(dpp: number, txCode: string, hasNpwp: boolean): Promise<TaxCalc> {
  const entry = TAX_TX.find((t) => t.code === txCode);
  if (!entry) return { rate: 0, ppn: 0, pph: 0, isFinal: false, basis: "" };

  if (txCode === "ORANG_PRIBADI") {
    const base = pph21(dpp);
    return { rate: entry.rate, ppn: 0, pph: hasNpwp ? base : base * 1.2, isFinal: false, basis: entry.basis };
  }

  const rate = await liveTaxRate(txCode);
  const pph = dpp * (rate / 100) * (hasNpwp ? 1 : 2);
  const ppnRate = await liveTaxRate("PPN");
  const ppn = txCode === "BARANG" || entry.basis.includes("PPh 22") ? 0 : dpp * (ppnRate / 100);
  return { rate, ppn, pph, isFinal: entry.isFinal, basis: entry.basis };
}

