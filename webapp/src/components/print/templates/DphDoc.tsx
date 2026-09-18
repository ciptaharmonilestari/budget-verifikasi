import { PrintLetterhead, PrintRule, PrintStamp } from "../PrintLetterhead";
import { SignatureBlock } from "../SignatureBlock";
import { rupiah, idDate } from "@/lib/format";
import type { PrintCommonData } from "@/lib/print-types";

interface VendorQuote {
  vendor: string;
  total: number;
}

export function DphDoc({ data: d }: { data: PrintCommonData }) {
  const quotes = Array.isArray(d.formData.vendorQuotes) ? (d.formData.vendorQuotes as VendorQuote[]) : null;

  return (
    <div className="om-sheet">
      <PrintStamp label="DRAF" color="#1b1b1b" />
      <PrintLetterhead ptName={d.ptName} wordmarkWidth={d.wordmarkWidth} />
      <PrintRule />

      <div className="om-doctitle">
        <div>
          <h1>DAFTAR PEMBAYARAN HARIAN (DPH)</h1>
          <div className="om-docno">No. {d.indexNo}</div>
        </div>
        <img className="om-qr" src={d.qrDataUri} alt="QR berkas" width={54} height={54} />
      </div>

      <div className="om-field-grid">
        <div>Proyek</div><div>: {d.projectLabel}</div>
        <div>Departemen</div><div>: {d.deptName}</div>
        <div>Tanggal</div><div>: {idDate(d.createdAt)}</div>
        <div>Perihal</div><div>: {d.subject}</div>
      </div>

      {quotes ? (
        <table className="om-table">
          <thead>
            <tr>
              <th>Vendor</th>
              {quotes.map((q, i) => <th key={i} style={{ textAlign: "right" }}>{q.vendor}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total penawaran</td>
              {quotes.map((q, i) => <td key={i} className="num" style={{ textAlign: "right" }}>{rupiah(q.total)}</td>)}
            </tr>
          </tbody>
        </table>
      ) : (
        <table className="om-table">
          <thead>
            <tr><th>Uraian</th><th style={{ textAlign: "right" }}>Nilai</th></tr>
          </thead>
          <tbody>
            <tr><td>{d.subject}</td><td className="num" style={{ textAlign: "right" }}>{rupiah(d.value)}</td></tr>
          </tbody>
          <tfoot>
            <tr><td>Nilai diajukan</td><td className="num" style={{ textAlign: "right" }}>{rupiah(d.value)}</td></tr>
          </tfoot>
        </table>
      )}

      <p style={{ fontSize: 11, color: "#5a5a5a", marginBottom: 14 }}>
        Catatan: DPH ini disusun berdasarkan perbandingan harga dari vendor pengajuan. Vendor terpilih: {d.vendorName || "menunggu penetapan"}.
      </p>

      <SignatureBlock columns={d.signatureColumns} />
    </div>
  );
}
