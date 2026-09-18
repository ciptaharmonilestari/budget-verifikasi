import { PrintLetterhead, PrintRule, PrintStamp } from "../PrintLetterhead";
import { SignatureBlock } from "../SignatureBlock";
import { rupiah, idDate, terbilang } from "@/lib/format";
import type { PrintCommonData } from "@/lib/print-types";

export function BayarRingkasDoc({ data: d }: { data: PrintCommonData }) {
  return (
    <div className="om-sheet">
      <PrintStamp label="DRAF" color="#1b1b1b" />
      <PrintLetterhead ptName={d.ptName} wordmarkWidth={d.wordmarkWidth} />
      <PrintRule />

      <div className="om-doctitle">
        <div>
          <h1>PERMOHONAN PEMBAYARAN</h1>
          <div className="om-docno">No. {d.indexNo}</div>
        </div>
        <img className="om-qr" src={d.qrDataUri} alt="QR berkas" width={58} height={58} />
      </div>

      <div className="om-field-grid">
        <div>Proyek</div><div>: {d.projectLabel}</div>
        <div>Departemen</div><div>: {d.deptName}</div>
        <div>Vendor</div><div>: {d.vendorName || "—"}</div>
        <div>Tanggal</div><div>: {idDate(d.createdAt)}</div>
        <div>Perihal</div><div>: {d.subject}</div>
      </div>

      <table className="om-table">
        <thead>
          <tr><th>Uraian Perhitungan</th><th style={{ textAlign: "right" }}>Jumlah</th></tr>
        </thead>
        <tbody>
          <tr><td>Nilai diajukan</td><td className="num" style={{ textAlign: "right" }}>{rupiah(d.value)}</td></tr>
        </tbody>
        <tfoot>
          <tr><td>Total dibayarkan</td><td className="num" style={{ textAlign: "right" }}>{rupiah(d.value)}</td></tr>
        </tfoot>
      </table>

      <p style={{ fontStyle: "italic", marginBottom: 14 }}>Terbilang: {terbilang(d.value)}.</p>

      <SignatureBlock columns={d.signatureColumns} />
    </div>
  );
}
