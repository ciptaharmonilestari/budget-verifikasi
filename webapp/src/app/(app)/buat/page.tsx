import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { BuatPengajuanForm } from "./BuatPengajuanForm.client";

export default async function BuatPengajuanPage() {
  const user = await requireUser();

  const [companies, departments, vendors, contracts] = await Promise.all([
    prisma.company.findMany({ include: { projects: true }, orderBy: { code: "asc" } }),
    prisma.department.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
    prisma.contract.findMany({ where: { status: "AKTIF" }, include: { vendor: true, project: true }, orderBy: { instrumentNo: "asc" } }),
  ]);

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Buat Pengajuan</h1>
      <p style={{ color: "var(--ink-3)", fontSize: 14, marginTop: 4, marginBottom: 20 }}>
        Pilih jenis berkas, lengkapi identitas dan naskah, lalu kirim ke antrean. Nomor indeks terbit otomatis saat dikirim.
      </p>
      <BuatPengajuanForm
        companies={companies.map((c) => ({
          id: c.id, code: c.code, name: c.name,
          projects: c.projects.map((p) => ({ id: p.id, name: p.name })),
        }))}
        departments={departments.map((d) => ({ id: d.id, code: d.code, name: d.name }))}
        vendors={vendors.map((v) => ({ id: v.id, name: v.name, npwp: v.npwp }))}
        contracts={contracts.map((c) => ({ id: c.id, instrumentNo: c.instrumentNo, vendorName: c.vendor.name, projectName: c.project.name }))}
        defaultDari={user.name}
      />
    </div>
  );
}
