import { prisma } from "@/lib/prisma";
import {
  PARAM_DEFS, type ParamDef, formatParamValue, paramApproverRole,
  validateParamValue, parseParamNumber,
} from "@/lib/parameters";
import type { Role } from "@/generated/prisma/client";

export interface ParamRow {
  def: ParamDef;
  currentValue: string;
  effectiveDate: Date;
  pending: {
    id: string;
    proposedValue: string;
    proposedEffectiveDate: Date;
    approverRole: Role;
    proposedByName: string;
    reason: string | null;
  } | null;
  blank: boolean;
  historyCount: number;
}

export async function getParamRows(): Promise<ParamRow[]> {
  const [values, pendings, historyCounts] = await Promise.all([
    prisma.parameterValue.findMany(),
    prisma.parameterProposal.findMany({ where: { status: "PENDING" }, include: { proposedBy: true } }),
    prisma.parameterHistory.groupBy({ by: ["parameterId"], _count: { _all: true } }),
  ]);
  const valueById = new Map(values.map((v) => [v.parameterId, v]));
  const pendingById = new Map(pendings.map((p) => [p.parameterId, p]));
  const historyCountById = new Map(historyCounts.map((h) => [h.parameterId, h._count._all]));

  return PARAM_DEFS.map((def) => {
    const value = valueById.get(def.id);
    const pending = pendingById.get(def.id);
    return {
      def,
      currentValue: value?.currentValue ?? def.sampleValue,
      effectiveDate: value?.effectiveDate ?? new Date(),
      pending: pending
        ? {
            id: pending.id,
            proposedValue: pending.proposedValue,
            proposedEffectiveDate: pending.proposedEffectiveDate,
            approverRole: pending.approverRole,
            proposedByName: pending.proposedBy.name,
            reason: pending.reason,
          }
        : null,
      blank: (value?.currentValue ?? def.sampleValue).trim().toLowerCase() === "belum diisi",
      historyCount: historyCountById.get(def.id) ?? 0,
    };
  });
}

export async function getAscendingValues(ascendingGroup: string): Promise<Map<number, number>> {
  const defs = PARAM_DEFS.filter((p) => p.ascendingGroup === ascendingGroup);
  const values = await prisma.parameterValue.findMany({ where: { parameterId: { in: defs.map((d) => d.id) } } });
  const valueById = new Map(values.map((v) => [v.parameterId, v.currentValue]));
  const map = new Map<number, number>();
  for (const d of defs) {
    const raw = valueById.get(d.id) ?? d.sampleValue;
    const n = parseParamNumber(raw);
    if (n !== null && d.ascendingOrder) map.set(d.ascendingOrder, n);
  }
  return map;
}

export async function validateForParam(def: ParamDef, rawValue: string): Promise<string> {
  const ctx = def.ascendingGroup ? { ascendingValues: await getAscendingValues(def.ascendingGroup) } : undefined;
  return validateParamValue(def, rawValue, ctx);
}

export { formatParamValue, paramApproverRole };
