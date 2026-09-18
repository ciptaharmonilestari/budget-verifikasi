import QRCode from "qrcode";

/**
 * QR content is a plain string (not a full URL scheme), matching the
 * prototype's decision #8: `kbt.ciptaharmoni.com/b/<nomor indeks>`, generated
 * offline (no external service — the `qrcode` npm package runs entirely
 * server-side here, replacing the prototype's hand-rolled encoder per the
 * source analysis's recommendation).
 */
export function qrContentForIndexNo(indexNo: string): string {
  return `kbt.ciptaharmoni.com/b/${indexNo}`;
}

export async function generateQrDataUri(content: string, sizePx = 200): Promise<string> {
  return QRCode.toDataURL(content, { margin: 1, width: sizePx, errorCorrectionLevel: "M" });
}
