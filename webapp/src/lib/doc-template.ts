import type { FormKind } from "@/generated/prisma/client";

export type DocTemplate = "MEMO" | "BAYAR_RINGKAS" | "DPH" | "BAPP";

/**
 * Maps a submission's form kind to one of the 4 print sheets. Reconstructed
 * from FORM_KINDS' own labels (BAYAR = "IOM Payment (BAPP)" maps directly to
 * the landscape BAPP sheet; FIN = "IOM Finance (Payment Voucher)" maps to the
 * compact payment-summary sheet) since the prototype's exact per-kind
 * print-template dispatch wasn't recovered verbatim from the source read —
 * documented here as an explicit, single place to reconsider if wrong.
 */
export function docTemplateForKind(kind: FormKind): DocTemplate {
  switch (kind) {
    case "BAYAR":
      return "BAPP";
    case "FIN":
      return "BAYAR_RINGKAS";
    case "DPH":
      return "DPH";
    default:
      return "MEMO";
  }
}

export const WORDMARK_WIDTH: Record<DocTemplate, number> = {
  MEMO: 126,
  BAYAR_RINGKAS: 116,
  DPH: 110,
  BAPP: 104,
};
