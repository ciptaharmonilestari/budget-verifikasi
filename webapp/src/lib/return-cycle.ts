import { prisma } from "@/lib/prisma";
import { PARAM_DEFS, parseParamNumber } from "@/lib/parameters";
import type { Prisma } from "@/generated/prisma/client";

const MAX_CYCLES_DEF = PARAM_DEFS.find((p) => p.group === "SLA_MASA_BERLAKU" && p.label === "Maksimum siklus pengembalian")!;

/** RETURN_RULES #2: "Maksimum dua siklus pengembalian untuk satu pengajuan.
 * Siklus ketiga dieskalasi ke CFO sebagai isu kepatuhan departemen." Reads
 * the live threshold from the Settings register (default 2) rather than
 * hardcoding it. Returns the return-cycle mutation to merge into a
 * `submission.update` `data` object, plus an optional Notification create
 * to append to the same transaction when the cap is breached. */
export async function returnCycleUpdate(currentReturnCycles: number, submissionId: string) {
  const row = await prisma.parameterValue.findUnique({ where: { parameterId: MAX_CYCLES_DEF.id } });
  const maxCycles = (row ? parseParamNumber(row.currentValue) : null) ?? 2;

  const newCycles = currentReturnCycles + 1;
  const escalate = newCycles >= maxCycles + 1; // 3rd cycle when max is 2

  const data: Prisma.SubmissionUpdateInput = { returnCycles: newCycles };

  const notificationCreate = escalate
    ? prisma.notification.create({
        data: {
          category: "STATUS",
          title: "Siklus pengembalian melewati batas",
          body: `Berkas ini sudah dikembalikan ${newCycles} kali (batas ${maxCycles}) — dieskalasi ke CFO sebagai isu kepatuhan departemen (§9.6).`,
          submissionId,
          tagLevel: "FAIL",
          toRole: "CFO",
        },
      })
    : null;

  return { data, notificationCreate, escalate, newCycles, maxCycles };
}
