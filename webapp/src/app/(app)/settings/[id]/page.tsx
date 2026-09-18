import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PARAM_BY_ID } from "@/lib/parameters";
import { ParamDetail } from "./ParamDetail.client";
import type { HistoryEntry } from "../ParamRow.client";

export default async function ParamDetailPage({ params }: PageProps<"/settings/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const def = PARAM_BY_ID.get(id);
  if (!def) notFound();

  const [value, pending, historyRaw] = await Promise.all([
    prisma.parameterValue.findUnique({ where: { parameterId: id } }),
    prisma.parameterProposal.findFirst({ where: { parameterId: id, status: "PENDING" }, include: { proposedBy: true } }),
    prisma.parameterHistory.findMany({ where: { parameterId: id }, include: { by: true }, orderBy: { at: "desc" } }),
  ]);

  const history: HistoryEntry[] = historyRaw.map((h) => ({
    id: h.id, kind: h.kind, fromValue: h.fromValue, toValue: h.toValue,
    byName: h.by.name, at: h.at, effectiveDate: h.effectiveDate, reason: h.reason,
  }));

  return (
    <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 16 }}>
      <Link href="/settings" className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }}>← Kembali ke Settings</Link>
      <ParamDetail
        def={def}
        currentValue={value?.currentValue ?? def.sampleValue}
        pending={
          pending
            ? {
                id: pending.id, proposedValue: pending.proposedValue, proposedEffectiveDate: pending.proposedEffectiveDate,
                approverRole: pending.approverRole, proposedByName: pending.proposedBy.name, reason: pending.reason,
              }
            : null
        }
        history={history}
        userRole={user.role}
      />
    </div>
  );
}
