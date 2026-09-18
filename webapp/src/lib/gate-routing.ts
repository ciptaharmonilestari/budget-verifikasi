import { prisma } from "@/lib/prisma";
import { authorityTierIds, parseParamNumber } from "@/lib/parameters";

/**
 * Gate routing — reconciles two slightly different authority tables found in
 * the source material:
 *  - The prototype's hardcoded TIERS routing (`value > 5e9 ? 6 : value > 5e8 ? 5 : 4`)
 *  - The PRD §5 "Batas kewenangan" table, driven by the same 4 tier +
 *    RUPS parameters that the Settings/Parameter screen makes editable
 *    ("Rute ditentukan matriks kewenangan berdasarkan nilai berkas", and
 *    decision log #11: "Penyetuju parameter mengikuti matriks kewenangan
 *    yang ada" — one matrix, not two).
 *
 * We use the PRD table as the live source of truth, so changing the
 * "Tingkat kewenangan" parameters actually changes routing (the prototype's
 * hardcoded thresholds did not). See final report for this reconciliation.
 */
export async function currentAuthorityTiers() {
  const ids = authorityTierIds();
  const rows = await prisma.parameterValue.findMany({ where: { parameterId: { in: Object.values(ids) } } });
  const byId = new Map(rows.map((r) => [r.parameterId, r.currentValue]));
  const num = (id: string, fallback: number) => {
    const raw = byId.get(id);
    if (!raw) return fallback;
    const n = parseParamNumber(raw);
    return n ?? fallback;
  };
  return {
    tier1: num(ids.tier1, 50e6),
    tier2: num(ids.tier2, 250e6),
    tier3: num(ids.tier3, 1e9),
    tier4: num(ids.tier4, 5e9),
    rups: byId.get(ids.rups) && byId.get(ids.rups) !== "belum diisi" ? num(ids.rups, Infinity) : null,
  };
}

export interface RouteResult {
  routeGate: 4 | 5 | 6;
  tierBand: string;
  requiresRups: boolean;
}

export async function routeGateForValue(value: number): Promise<RouteResult> {
  const tiers = await currentAuthorityTiers();
  const requiresRups = tiers.rups !== null && value > tiers.rups;
  if (value > tiers.tier4) {
    return { routeGate: 6, tierBand: "> Batas tingkat 4 — CEO 1" + (requiresRups ? " + RUPS/BoD" : ""), requiresRups };
  }
  if (value > tiers.tier3) {
    return { routeGate: 5, tierBand: "Batas tingkat 3–4 — CFO", requiresRups: false };
  }
  return { routeGate: 4, tierBand: "≤ Batas tingkat 3 — CEO Project", requiresRups: false };
}

/** AUTH_EXTRA rule: direct-appointment (penunjukan langsung) escalates one authority tier. */
export function escalateOneTier(route: RouteResult): RouteResult {
  if (route.routeGate === 4) return { ...route, routeGate: 5 };
  if (route.routeGate === 5) return { ...route, routeGate: 6 };
  return route;
}
