import { PrintLetterhead, PrintRule, PrintStamp } from "../PrintLetterhead";
import { SignatureBlock } from "../SignatureBlock";
import { rupiah, idDate, terbilang } from "@/lib/format";
import type { PrintCommonData } from "@/lib/print-types";

export function MemoDoc({ data: d }: { data: PrintCommonData }) {
  const kepada = d.memo.kepada || "Yth. Direksi terkait";
  const dari = d.memo.dari || d.createdByName;
  const tanggal = d.memo.tanggal || idDate(d.createdAt);
  const perihal = d.memo.perihal || d.subject;
  const isi = d.memo.isi ||
    `Sehubungan dengan kebutuhan operasional pada proyek ${d.projectLabel}, bersama ini kami mengajukan permohonan persetujuan sebesar ${rupiah(d.value)} untuk keperluan "${d.subject}".`;

  return (
    <div className="om-sheet">
      <PrintStamp label="DRAF" color="#1b1b1b" />
      <PrintLetterhead ptName={d.ptName} wordmarkWidth={d.wordmarkWidth} />
      <PrintRule />

      <div className="om-doctitle">
        <div>
          <h1>MEMO / IOM</h1>
          <div className="om-docno">No. {d.indexNo}</div>
        </div>
        <img className="om-qr" src={d.qrDataUri} alt="QR berkas" width={66} height={66} />
      </div>

      <div className="om-field-grid">
        <div>Kepada</div><div>: {kepada}</div>
        <div>Dari</div><div>: {dari}</div>
        <div>Tanggal</div><div>: {tanggal}</div>
        <div>Perihal</div><div>: {perihal}</div>
      </div>

      <p style={{ marginBottom: 14 }}>{isi}</p>

      <table className="om-table">
        <thead>
          <tr><th>Uraian</th><th style={{ textAlign: "right" }}>Nilai</th></tr>
        </thead>
        <tbody>
          <tr><td>{d.subject}</td><td className="num" style={{ textAlign: "right" }}>{rupiah(d.value)}</td></tr>
        </tbody>
        <tfoot>
          <tr><td>Total</td><td className="num" style={{ textAlign: "right" }}>{rupiah(d.value)}</td></tr>
        </tfoot>
      </table>

      <p style={{ fontStyle: "italic", marginBottom: 14 }}>Terbilang: {terbilang(d.value)}.</p>

      <p style={{ marginBottom: 6, fontSize: 11 }}>
        Demikian permohonan ini kami sampaikan, atas persetujuan Bapak/Ibu kami ucapkan terima kasih.
      </p>
      <p style={{ fontSize: 10.5, color: "#5a5a5a" }}>Pemotongan pajak (bila ada) mengikuti tarif berlaku pada saat pembayaran.</p>

      <SignatureBlock columns={d.signatureColumns} />
    </div>
  );
}
