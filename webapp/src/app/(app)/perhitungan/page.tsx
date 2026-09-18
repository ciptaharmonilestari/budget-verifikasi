import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { rupiah } from "@/lib/format";
import { ContractPicker } from "./ContractPicker.client";
import { PerhitunganCalculator, type WorkRow } from "./PerhitunganCalculator.client";

/** Uraian pekerjaan + bobot% dari nilai kontrak (dc.html `WORKS` constant,
 * lines 5243-5251). Bobot sums to exactly 100%. */
const WORKS: Array<[name: string, unit: string, pct: number]> = [
  ["Pekerjaan persiapan & mobilisasi", "ls", 3.5],
  ["Pekerjaan tanah & pondasi bore pile", "ttk", 14.0],
  ["Struktur beton bertulang lantai 1–8", "m³", 38.5],
  ["Dinding bata ringan & plesteran", "m²", 12.0],
  ["Atap & waterproofing", "m²", 7.5],
  ["Instalasi MEP kasar", "ls", 10.5],
  ["Arsitektur & finishing", "m²", 14.0],
];

export default async function PerhitunganPage({ searchParams }: PageProps<"/perhitungan">) {
  await requireUser();
  const sp = await searchParams;
  const requestedId = typeof sp.contractId === "string" ? sp.contractId : undefined;

  const contracts = await prisma.contract.findMany({
    where: { status: "AKTIF" },
    include: { vendor: true, project: true, company: true },
    orderBy: { instrumentNo: "asc" },
  });

  const selected = (requestedId && contracts.find((c) => c.id === requestedId)) || contracts[0];

  const submission = selected
    ? await prisma.submission.findFirst({ where: { contractId: selected.id }, orderBy: { createdAt: "desc" } })
    : null;

  const works: WorkRow[] = selected
    ? WORKS.map(([name, unit, bobotPct]) => ({
        name,
        unit,
        bobotPct,
        bobotRp: (Number(selected.value) * bobotPct) / 100,
      }))
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 12.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)" }}>
          DOC-04 · FR-211 · kertas kerja BOQ
        </div>
        <h1 style={{ fontSize: 29, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 3 }}>Lembar Perhitungan</h1>
        <p style={{ color: "var(--ink-2)", maxWidth: "64ch", marginTop: 6 }}>
          Bobot per uraian pekerjaan mengikuti SPK. Isi progres s/d bulan lalu dan bulan ini; seluruh kolom rupiah dan
          potongan dihitung sistem. Lembar ini adalah kertas kerja/scratchpad — tidak ada yang tersimpan ke berkas.
        </p>
      </div>

      <div className="card">
        <ContractPicker
          contracts={contracts.map((c) => ({ id: c.id, label: `${c.instrumentNo} · ${c.vendor.name} · ${c.company.code}—${c.project.name}` }))}
          contractId={selected?.id ?? ""}
        />
      </div>

      {!selected ? (
        <div className="card" style={{ color: "var(--ink-3)" }}>Tidak ada kontrak berstatus Aktif untuk dihitung.</div>
      ) : (
        <>
          <div className="card">
            <div className="grid3">
              <HeadField label="Instrumen" value={selected.instrumentNo} />
              <HeadField label="Vendor" value={selected.vendor.name} />
              <HeadField label="PT / Proyek" value={`${selected.company.code} — ${selected.project.name}`} />
              <HeadField label="Cost code" value={selected.costCode} />
              <HeadField label="Nilai kontrak" value={rupiah(Number(selected.value))} />
              <HeadField label="DP / Retensi kontrak" value={`${Number(selected.dpPct)}% / ${Number(selected.retensiPct)}%`} />
            </div>
          </div>

          <PerhitunganCalculator
            works={works}
            contractValue={Number(selected.value)}
            dpPct={Number(selected.dpPct)}
            retensiPct={Number(selected.retensiPct)}
            verifikasiHref={submission ? `/verifikasi/${submission.id}` : null}
          />
        </>
      )}
    </div>
  );
}

function HeadField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="field-label">{label}</div>
      <div className="num" style={{ fontSize: 14, marginTop: 2 }}>{value}</div>
    </div>
  );
}
