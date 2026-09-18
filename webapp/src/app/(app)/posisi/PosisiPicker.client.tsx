"use client";

import { useRouter } from "next/navigation";

export interface PickerCompany {
  id: string;
  code: string;
  name: string;
  projects: Array<{ id: string; name: string }>;
}

/**
 * Small client form wrapping two <select>s that navigates via ?pt=&project=
 * search params — kept as a plain client component per the brief rather than
 * a full client-state picker, since the server page owns all the data.
 */
export function PosisiPicker({
  companies,
  companyId,
  projectId,
}: {
  companies: PickerCompany[];
  companyId: string;
  projectId: string;
}) {
  const router = useRouter();
  const company = companies.find((c) => c.id === companyId);

  function goTo(pt: string, project: string) {
    router.push(`/posisi?pt=${pt}&project=${project}`);
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
      <label style={{ display: "block", flex: "1 1 250px" }}>
        <span className="field-label">Perusahaan</span>
        <select
          className="select"
          value={companyId}
          onChange={(e) => {
            const nextCompany = companies.find((c) => c.id === e.target.value);
            const nextProject = nextCompany?.projects[0]?.id ?? "";
            goTo(e.target.value, nextProject);
          }}
        >
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: "block", flex: "1 1 200px" }}>
        <span className="field-label">Proyek</span>
        <select
          className="select"
          value={projectId}
          onChange={(e) => goTo(companyId, e.target.value)}
        >
          {(company?.projects ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
