import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getParamRows } from "./logic";
import { ParamRow, type ParamRowData, type HistoryEntry } from "./ParamRow.client";
import { ResetAllButton } from "./ResetAllButton.client";
import type { ParamGroup } from "@/generated/prisma/client";

const GROUP_ORDER: ParamGroup[] = ["TINGKAT_KEWENANGAN", "TARIF_PAJAK", "AMBANG_KONTRAK", "AMBANG_DEVIASI", "SLA_MASA_BERLAKU"];

export default async function SettingsPage() {
  const user = await requireUser();
  const [rows, historyRaw] = await Promise.all([
    getParamRows(),
    prisma.parameterHistory.findMany({ include: { by: true }, orderBy: { at: "desc" } }),
  ]);

  const historyByParam = new Map<string, HistoryEntry[]>();
  for (const h of historyRaw) {
    const list = historyByParam.get(h.parameterId) ?? [];
    list.push({ id: h.id, kind: h.kind, fromValue: h.fromValue, toValue: h.toValue, byName: h.by.name, at: h.at, effectiveDate: h.effectiveDate, reason: h.reason });
    historyByParam.set(h.parameterId, list);
  }

  const enriched: ParamRowData[] = rows.map((r) => ({
    def: r.def, currentValue: r.currentValue, effectiveDate: r.effectiveDate, blank: r.blank,
    pending: r.pending, history: historyByParam.get(r.def.id) ?? [],
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Settings — Register Parameter</h1>
          <p style={{ color: "var(--ink-3)", fontSize: 14, marginTop: 4, maxWidth: 640 }}>
            Register parameter menggantikan konstanta di kode. Semua rentang di bawah adalah usulan sistem —
            <strong> PERLU DIKONFIRMASI FINANCE</strong>, ditandai jelas sebagai belum final.
          </p>
        </div>
        <ResetAllButton />
      </div>

      {GROUP_ORDER.map((group) => {
        const groupRows = enriched.filter((r) => r.def.group === group);
        if (groupRows.length === 0) return null;
        return (
          <section key={group} className="card">
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>{groupRows[0].def.groupLabel}</h2>
            <p style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 2, marginBottom: 14 }}>{groupRows[0].def.groupNote}</p>
            <div style={{ overflowX: "auto" }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Nilai berlaku</th>
                    <th data-extra="">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {groupRows.map((row) => (
                    <ParamRow key={row.def.id} row={row} userRole={user.role} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
