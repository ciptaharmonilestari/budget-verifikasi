import { groupSignatureColumns, type SignatureColumnLike } from "@/lib/signature";

export function SignatureBlock({ columns }: { columns: SignatureColumnLike[] }) {
  const groups = groupSignatureColumns(columns);
  const wrap2 = columns.length >= 5;

  return (
    <div className={`om-signblock${wrap2 ? " om-wrap2" : ""}`}>
      {groups.map((g, gi) => (
        <div key={gi} className="om-signcol" style={{ flex: g.columns.length }}>
          <div className="om-signrole">{g.role}</div>
          <div style={{ display: "flex", gap: 4 }}>
            {g.columns.map((c, ci) => (
              <div key={ci} style={{ flex: 1 }}>
                <div className="om-signspace" />
                <div className="om-signname">{c.name || "( . . . . . . . . . . )"}</div>
                <div className="om-signjabatan">{c.jabatan}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
