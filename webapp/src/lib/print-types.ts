import type { SignatureColumnLike } from "@/lib/signature";

export type PrintCommonData = {
  indexNo: string;
  subject: string;
  ptName: string;
  projectLabel: string;
  deptName: string;
  value: number;
  createdAt: Date;
  createdByName: string;
  vendorName?: string;
  memo: Record<string, string>;
  formData: Record<string, unknown>;
  qrDataUri: string;
  signatureColumns: SignatureColumnLike[];
  wordmarkWidth: number;
};
