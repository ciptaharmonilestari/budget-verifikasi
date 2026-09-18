/**
 * Shared letterhead for all 4 print sheets. Per decision log #5/#6: the
 * parent wordmark (Cipta Harmoni Lestari) is NOT printed — only the
 * operating PT's name, and it's shown as text, never a duplicated logo.
 * `wordmarkWidth` differs per sheet (126/116/110/104px) exactly to keep the
 * header block from ballooning — logo-chl.png is 483x51, very wide, so it
 * must be width-constrained with height:auto, never height-constrained.
 */
export function PrintLetterhead({
  ptName,
  wordmarkWidth,
  budgetLabel,
  budgetPagu,
  budgetPemakaian,
}: {
  ptName: string;
  wordmarkWidth: number;
  budgetLabel?: string;
  budgetPagu?: string;
  budgetPemakaian?: string;
}) {
  void wordmarkWidth;
  return (
    <div className="om-head">
      <div className="om-head-left">
        <div>
          <div className="om-pt-name">{ptName}</div>
          <div className="om-pt-addr">Cipta Harmoni Lestari Group</div>
        </div>
      </div>
      {budgetLabel && (
        <div className="om-anggaran-box">
          <div className="om-box-title">Anggaran</div>
          <div>{budgetLabel}</div>
          {budgetPagu && <div>Pagu: {budgetPagu}</div>}
          {budgetPemakaian && <div>Pemakaian: {budgetPemakaian}</div>}
        </div>
      )}
    </div>
  );
}

export function PrintRule() {
  return (
    <>
      <hr className="om-rule-thick" />
      <hr className="om-rule-thin" />
    </>
  );
}

export function PrintStamp({ label, color }: { label: string; color: string }) {
  return (
    <div className="om-stamp" style={{ color }}>
      {label}
    </div>
  );
}
