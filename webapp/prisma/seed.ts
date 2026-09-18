import { PrismaClient, Role } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import {
  DEPTS, GROUP, ALLOC, DEMO_USERS,
} from "../src/lib/reference-data";
import { PARAM_DEFS } from "../src/lib/parameters";

const prisma = new PrismaClient();

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
function indexNo(nnn: number, ptCode: string, projectName: string, deptCode: string, date: Date) {
  const roman = ROMAN[date.getMonth() + 1];
  return `${String(nnn).padStart(3, "0")}/${ptCode}-${projectName}-${deptCode}/${roman}/${date.getFullYear()}`;
}

async function main() {
  console.log("Seeding departments...");
  const deptByCode = new Map<string, string>();
  for (const [code, name, roleNote] of DEPTS) {
    const d = await prisma.department.upsert({
      where: { code },
      update: { name, roleNote },
      create: { code, name, roleNote },
    });
    deptByCode.set(code, d.id);
  }

  console.log("Seeding companies & projects...");
  const companyByCode = new Map<string, string>();
  const projectByKey = new Map<string, string>(); // `${ptCode}|${projectName}` -> projectId
  for (const [code, name, projects, locked] of GROUP) {
    const c = await prisma.company.upsert({
      where: { code },
      update: { name, locked },
      create: { code, name, locked },
    });
    companyByCode.set(code, c.id);
    for (const [projectName, seqCount] of projects) {
      const p = await prisma.project.upsert({
        where: { companyId_name: { companyId: c.id, name: projectName } },
        update: { currentSequence: 100000 + seqCount },
        create: { companyId: c.id, name: projectName, currentSequence: 100000 + seqCount },
      });
      projectByKey.set(`${code}|${projectName}`, p.id);
    }
  }

  /** Resolves a PT+Project pair, creating a fallback record if the prototype's
   * sample data references a combination outside the official GROUP master list
   * (this happens once, for allocation ALC-2026-0126 / PT code "BOR" — flagged
   * in the final report as a master-data gap inherited from the prototype). */
  async function resolveCompanyProject(ptCode: string, projectName: string) {
    let companyId = companyByCode.get(ptCode);
    if (!companyId) {
      const c = await prisma.company.upsert({
        where: { code: ptCode },
        update: {},
        create: { code: ptCode, name: `PT ${ptCode} (belum terdaftar di master PT)`, locked: false },
      });
      companyId = c.id;
      companyByCode.set(ptCode, companyId);
    }
    const key = `${ptCode}|${projectName}`;
    let projectId = projectByKey.get(key);
    if (!projectId) {
      const p = await prisma.project.upsert({
        where: { companyId_name: { companyId, name: projectName } },
        update: {},
        create: { companyId, name: projectName, currentSequence: 100000 },
      });
      projectId = p.id;
      projectByKey.set(key, projectId);
    }
    return { companyId, projectId };
  }

  console.log("Seeding users...");
  const userByUsername = new Map<string, string>();
  const demoPasswordHash = await bcrypt.hash("KbtDemo#2026", 10);
  for (const u of DEMO_USERS) {
    const [lastPart] = [u.lastLogin];
    const lastLoginAt = parseIdDate(lastPart);
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: { name: u.name, role: u.role as Role, lastLoginAt },
      create: {
        username: u.username,
        name: u.name,
        role: u.role as Role,
        passwordHash: demoPasswordHash,
        departmentId: u.deptCode ? deptByCode.get(u.deptCode) : undefined,
        lastLoginAt,
      },
    });
    userByUsername.set(u.username, user.id);
  }
  const systemUserId = userByUsername.get("r.wibowo")!;

  console.log("Seeding budget allocations...");
  const allocByNo = new Map<string, string>();
  for (const [allocNo, ptCode, projectName, costCode, name, pagu] of ALLOC) {
    const { companyId, projectId } = await resolveCompanyProject(ptCode, projectName);
    const a = await prisma.budgetAllocation.upsert({
      where: { allocNo },
      update: { pagu },
      create: { allocNo, companyId, projectId, costCode, name, pagu },
    });
    allocByNo.set(allocNo, a.id);
  }

  console.log("Seeding vendors...");
  const vendorByName = new Map<string, string>();
  async function vendor(name: string, opts: Partial<{ npwp: string; bank: string; rekening: string; alamat: string; pkpStatus: "PKP" | "NON_PKP"; tipeSupplier: string }> = {}) {
    if (vendorByName.has(name)) return vendorByName.get(name)!;
    const v = await prisma.vendor.create({ data: { name, pkpStatus: opts.pkpStatus ?? "PKP", ...opts } });
    vendorByName.set(name, v.id);
    return v.id;
  }

  const vWijaya = await vendor("PT Wijaya Struktur Prima", { npwp: "21.118.472.6-041.000", bank: "Bank Central Asia", rekening: "168366234", alamat: "Jl. Industri Raya No. 12, Serpong, Tangerang Selatan", tipeSupplier: "Penyedia barang dan jasa" });
  const vLanskap = await vendor("PT Bangun Lanskap Utama");
  const vFasad = await vendor("PT Cipta Fasad Indonesia", { pkpStatus: "PKP" });
  const vElektra = await vendor("PT Elektra Daya Nusantara");
  const vPameran = await vendor("PT Ruang Pamer Kreatif");
  const vSarana = await vendor("PT Sarana Bumi Persada");
  const vUkur = await vendor("PT Sarana Ukur Presisi");
  await vendor("Sdr. Bagas Ardiansyah", { pkpStatus: "NON_PKP" });

  console.log("Seeding contracts, payment schedules, guarantees...");
  const { companyId: sbcId } = await resolveCompanyProject("SBC", "Banara");
  const banaraId = projectByKey.get("SBC|Banara")!;
  const naraya = await resolveCompanyProject("SBC", "Naraya");
  const mazenta = await resolveCompanyProject("SBC", "Mazenta");

  const contractSpk014 = await prisma.contract.upsert({
    where: { instrumentNo: "SPK-2026-014" },
    update: {},
    create: {
      instrumentNo: "SPK-2026-014", kind: "KONTRAK", vendorId: vWijaya,
      companyId: sbcId, projectId: banaraId, costCode: "STR-02",
      value: 25680000000, startDate: new Date("2026-01-15"), endDate: new Date("2026-12-31"),
      dpPct: 20, retensiPct: 5, status: "AKTIF", tagLevel: "INFO",
      extra: {
        tglKontrak: "2026-09-01", tipeKontrak: "Annual Year", tipeKomitmen: "SPK / Kontrak",
        kegiatan: "Pekerjaan struktur Tower A", jenisKegiatan: "Jasa konstruksi",
        uraian: "Pekerjaan struktur Tower A tahap pertama, termasuk pembesian, bekisting dan pengecoran.",
        jwPelaksanaan: 121, jwPemeliharaan: 180,
        nilaiUm: 5136000000, caraBayar: "Bertahap (termin)", caraKembaliUm: "Proporsional per termin",
        penjaminUm: "Bank Central Asia", noJaminanUm: "BG-8841/2026", masaJaminanUm: "2027-03-31",
        potonganRetensi: "5% per termin", sanksi: "Denda 1 per mil per hari keterlambatan, maksimal 5 persen dari nilai kontrak.",
        ttdInternal: "Direktur PT Serpong Bangun Cipta", ttdMitra: "Direktur PT Wijaya Struktur Prima",
      },
    },
  });
  await seedTermins(contractSpk014.id, [
    ["Termin 1 — uang muka 20%", 5136000000, "PAID", "2026-02-12"],
    ["Termin 2 — progres 45%", 6420000000, "PAID", "2026-06-18"],
    ["Termin 3 — progres 60%", 3852000000, "OPEN", null],
    ["Termin 4 — progres 85%", 6420000000, "PLAN", null],
    ["Termin 5 — serah terima", 3852000000, "PLAN", null],
  ]);

  const contractSpk008 = await prisma.contract.upsert({
    where: { instrumentNo: "SPK-2026-008" },
    update: {},
    create: {
      instrumentNo: "SPK-2026-008", kind: "KONTRAK", vendorId: vLanskap,
      companyId: naraya.companyId, projectId: naraya.projectId, costCode: "LND-02",
      value: 6840000000, startDate: new Date("2026-03-02"), endDate: new Date("2026-11-30"),
      dpPct: 20, retensiPct: 5, status: "AKTIF", tagLevel: "INFO", extra: {},
    },
  });
  await seedTermins(contractSpk008.id, [
    ["Termin 1 — uang muka 20%", 1368000000, "PAID", "2026-03-14"],
    ["Termin 2 — progres 50%", 2736000000, "PAID", "2026-08-08"],
    ["Termin 3 — progres 80%", 1710000000, "PLAN", null],
    ["Termin 4 — serah terima", 1026000000, "PLAN", null],
  ]);

  const contractSpk047 = await prisma.contract.upsert({
    where: { instrumentNo: "SPK-2025-047" },
    update: {},
    create: {
      instrumentNo: "SPK-2025-047", kind: "KONTRAK", vendorId: vFasad,
      companyId: mazenta.companyId, projectId: mazenta.projectId, costCode: "ARS-03",
      value: 10500000000, startDate: new Date("2025-09-10"), endDate: new Date("2026-09-30"),
      dpPct: 15, retensiPct: 5, status: "AKTIF", tagLevel: "WARN", extra: {},
    },
  });
  await seedTermins(contractSpk047.id, [
    ["Termin 1 — uang muka 15%", 1575000000, "PAID", "2025-09-22"],
    ["Termin 2 — progres 40%", 2625000000, "PAID", "2026-01-30"],
    ["Termin 3 — progres 70%", 420000000, "PAID", "2026-05-19"],
    ["Termin 4 — progres 90%", 2625000000, "OPEN", null],
    ["Retensi 5%", 525000000, "PLAN", null],
  ]);

  const marchand = await resolveCompanyProject("SBC", "Marchand");
  const loa009 = await prisma.contract.upsert({
    where: { instrumentNo: "LOA-2026-009" }, update: {},
    create: { instrumentNo: "LOA-2026-009", kind: "LOA", vendorId: vElektra, companyId: marchand.companyId, projectId: marchand.projectId, costCode: "MEP-01", value: 3150000000, status: "AKTIF", tagLevel: "WARN", extra: {} },
  });
  const loa003 = await prisma.contract.upsert({
    where: { instrumentNo: "LOA-2026-003" }, update: {},
    create: { instrumentNo: "LOA-2026-003", kind: "LOA", vendorId: vElektra, companyId: mazenta.companyId, projectId: mazenta.projectId, costCode: "MEP-02", value: 1480000000, status: "KEDALUWARSA", tagLevel: "FAIL", extra: {} },
  });
  await prisma.contract.upsert({
    where: { instrumentNo: "ADD-2026-002" }, update: {},
    create: { instrumentNo: "ADD-2026-002", kind: "ADENDUM", vendorId: vWijaya, companyId: sbcId, projectId: banaraId, costCode: "STR-02", value: 1180000000, status: "AKTIF", tagLevel: "PASS", parentContractId: contractSpk014.id, extra: {} },
  });
  const corporate = await resolveCompanyProject("CHL", "HeadOffice");
  await prisma.contract.upsert({
    where: { instrumentNo: "PO-2026-121" }, update: {},
    create: { instrumentNo: "PO-2026-121", kind: "PO", vendorId: vPameran, companyId: corporate.companyId, projectId: corporate.projectId, costCode: "MKT-01", value: 214000000, status: "AKTIF", tagLevel: "INFO", extra: {} },
  });

  await prisma.guarantee.upsert({
    where: { id: "seed-bg-8841" }, update: {},
    create: { id: "seed-bg-8841", contractId: contractSpk014.id, kind: "UANG_MUKA", number: "BG-8841/2026", expiresAt: new Date("2026-10-06"), status: "WARN" },
  });
  await prisma.guarantee.upsert({
    where: { id: "seed-bg-7712" }, update: {},
    create: { id: "seed-bg-7712", contractId: contractSpk047.id, kind: "PELAKSANAAN", number: "BG-7712/2025", expiresAt: new Date("2026-09-27"), status: "WARN" },
  });

  console.log("Seeding parameter register...");
  for (const p of PARAM_DEFS) {
    await prisma.parameterDefinition.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id, label: p.label, group: p.group, unit: p.unit,
        min: p.min, max: p.max, ascendingGroup: p.ascendingGroup, ownerRole: p.ownerRole,
        ruleId: p.ruleId, sampleValue: p.sampleValue, sortOrder: p.sortOrder,
      },
    });
    await prisma.parameterValue.upsert({
      where: { parameterId: p.id },
      update: {},
      create: { parameterId: p.id, currentValue: p.sampleValue },
    });
  }

  console.log("Seeding submissions...");
  const pengaju = userByUsername.get("b.nugroho")!;
  const headdept = userByUsername.get("a.kurniawan")!;

  async function submission(opts: {
    nnn: number; ptCode: string; projectName: string; deptCode: string;
    kind: "PNJ" | "BAYAR" | "BIAYA" | "PTG" | "DPH" | "PO" | "FIN";
    docType: "DOC01" | "DOC02" | "DOC03" | "DOC04" | "DOC05";
    subject: string; costCode: string; value: number;
    status: "DRAFT" | "DEPT_APPROVAL" | "GATE1_KELENGKAPAN" | "RETURNED" | "GATE2_PARALLEL" | "GATE3_BUDGET_REVIEW" | "TREASURY_CHECK" | "GATE4_CEO_PROJECT" | "GATE5_CFO" | "GATE6_CEO1" | "APPROVED" | "REJECTED" | "PAID" | "VOID";
    tagLevel: "PASS" | "WARN" | "FAIL" | "INFO" | "NA";
    revisionCount: number; routeGate: number; createdById: string; vendorId?: string;
    contractId?: string; createdAt: Date;
  }) {
    const { companyId, projectId } = await resolveCompanyProject(opts.ptCode, opts.projectName);
    return prisma.submission.create({
      data: {
        indexNo: indexNo(opts.nnn, opts.ptCode, opts.projectName, opts.deptCode, opts.createdAt),
        kind: opts.kind, docType: opts.docType, subject: opts.subject,
        companyId, projectId, departmentId: deptByCode.get(opts.deptCode)!,
        costCode: opts.costCode, value: opts.value, status: opts.status, tagLevel: opts.tagLevel,
        revisionCount: opts.revisionCount, routeGate: opts.routeGate,
        currentGate: Math.min(opts.routeGate, 6), createdById: opts.createdById,
        vendorId: opts.vendorId, contractId: opts.contractId,
        createdAt: opts.createdAt, sentAt: opts.createdAt,
      },
    });
  }

  const subBanara188 = await submission({
    nnn: 188, ptCode: "SBC", projectName: "Banara", deptCode: "PRJ", kind: "BAYAR", docType: "DOC04",
    subject: "Termin 3 struktur Tower A", costCode: "STR-02", value: 3852000000,
    status: "GATE4_CEO_PROJECT", tagLevel: "WARN", revisionCount: 3, routeGate: 5,
    createdById: pengaju, vendorId: vWijaya, contractId: contractSpk014.id, createdAt: new Date("2026-09-08"),
  });
  const subBanara301 = await submission({
    nnn: 301, ptCode: "SBC", projectName: "Banara", deptCode: "PRJ", kind: "BIAYA", docType: "DOC03",
    subject: "Uang muka mobilisasi alat berat", costCode: "STR-02", value: 240000000,
    status: "DEPT_APPROVAL", tagLevel: "WARN", revisionCount: 0, routeGate: 4,
    createdById: pengaju, createdAt: new Date("2026-09-18"),
  });
  const subMazenta041 = await submission({
    nnn: 41, ptCode: "SBC", projectName: "Mazenta", deptCode: "PRJ", kind: "PNJ", docType: "DOC05",
    subject: "Adendum fasad & curtain wall", costCode: "ARS-03", value: 1180000000,
    status: "GATE3_BUDGET_REVIEW", tagLevel: "INFO", revisionCount: 1, routeGate: 5,
    createdById: pengaju, vendorId: vFasad, contractId: contractSpk047.id, createdAt: new Date("2026-09-16"),
  });
  await submission({
    nnn: 177, ptCode: "SBC", projectName: "Banara", deptCode: "PRJ", kind: "BAYAR", docType: "DOC04",
    subject: "Termin 2 struktur Tower A", costCode: "STR-02", value: 6420000000,
    status: "PAID", tagLevel: "PASS", revisionCount: 6, routeGate: 5,
    createdById: pengaju, vendorId: vWijaya, contractId: contractSpk014.id, createdAt: new Date("2026-06-10"),
  });
  const subMarchand058 = await submission({
    nnn: 58, ptCode: "SBC", projectName: "Marchand", deptCode: "PRJ", kind: "BAYAR", docType: "DOC04",
    subject: "Perbaikan saluran kawasan", costCode: "STR-02", value: 412000000,
    status: "RETURNED", tagLevel: "FAIL", revisionCount: 3, routeGate: 4,
    createdById: pengaju, createdAt: new Date("2026-09-15"),
  });
  await submission({
    nnn: 164, ptCode: "SBC", projectName: "Banara", deptCode: "PRJ", kind: "BIAYA", docType: "DOC03",
    subject: "Sewa alat bekisting Agustus", costCode: "STR-02", value: 96500000,
    status: "APPROVED", tagLevel: "PASS", revisionCount: 6, routeGate: 4,
    createdById: pengaju, createdAt: new Date("2026-08-20"),
  });
  const subTanglin184 = await submission({
    nnn: 184, ptCode: "BBH", projectName: "TanglinParc", deptCode: "PRJ", kind: "BAYAR", docType: "DOC04",
    subject: "Termin 5 lanskap", costCode: "LND-03", value: 1842000000,
    status: "GATE4_CEO_PROJECT", tagLevel: "PASS", revisionCount: 0, routeGate: 4,
    createdById: pengaju, vendorId: vLanskap, createdAt: new Date("2026-09-17"),
  });
  const bioDistrict = await resolveCompanyProject("SBL", "BioDistrict");
  const subBio022 = await submission({
    nnn: 22, ptCode: "SBL", projectName: "BioDistrict", deptCode: "PRC", kind: "PNJ", docType: "DOC01",
    subject: "Infrastruktur kawasan", costCode: "INF-01", value: 8940000000,
    status: "GATE6_CEO1", tagLevel: "WARN", revisionCount: 2, routeGate: 6,
    createdById: pengaju, vendorId: vSarana, createdAt: new Date("2026-09-14"),
  });
  const subBio317 = await submission({
    nnn: 317, ptCode: "SBL", projectName: "BioDistrict", deptCode: "MKM", kind: "BIAYA", docType: "DOC03",
    subject: "Pameran & open table Q4", costCode: "MKT-02", value: 186500000,
    status: "GATE5_CFO", tagLevel: "PASS", revisionCount: 0, routeGate: 5,
    createdById: pengaju, vendorId: vPameran, createdAt: new Date("2026-09-17"),
  });
  await submission({
    nnn: 79, ptCode: "SBC", projectName: "Naraya", deptCode: "PRC", kind: "PO", docType: "DOC03",
    subject: "Alat ukur lapangan impor", costCode: "PRC-04", value: 118000000,
    status: "GATE1_KELENGKAPAN", tagLevel: "WARN", revisionCount: 0, routeGate: 4,
    createdById: pengaju, vendorId: vUkur, createdAt: new Date("2026-09-17"),
  });
  const proyekCilejit = await resolveCompanyProject("BMM", "ProyekCilejit");
  await submission({
    nnn: 22, ptCode: "BMM", projectName: "ProyekCilejit", deptCode: "IT", kind: "DPH", docType: "DOC01",
    subject: "DPH pergantian SSD PC server", costCode: "IT-01", value: 968700,
    status: "GATE6_CEO1", tagLevel: "INFO", revisionCount: 1, routeGate: 6,
    createdById: pengaju, createdAt: new Date("2026-09-14"),
  });
  await submission({
    nnn: 288, ptCode: "SBL", projectName: "BioDistrict", deptCode: "MKM", kind: "PTG", docType: "DOC03",
    subject: "PTG advance dana tunai — event open table Q3", costCode: "MKT-02", value: 903500,
    status: "PAID", tagLevel: "PASS", revisionCount: 0, routeGate: 4,
    createdById: pengaju, createdAt: new Date("2026-09-12"),
  });

  console.log("Seeding gate decisions & lane clearances for a couple of representative submissions...");
  await prisma.gateDecision.create({
    data: { submissionId: subBanara188.id, gate: 3, verdict: "CLEAR_WITH_NOTES", comment: "Nilai retensi belum dipotong pada lampiran invoice.", actorId: userByUsername.get("d.prasetya")!, decidedAt: new Date("2026-09-17T16:41:03") },
  });
  for (const [lane, status, note] of [
    ["TAX", "MENUNGGU", "Menunggu balasan surel verifikasi tarif atas nilai kontrak Rp 3.852.000.000."],
    ["LEGAL", "TERVERIFIKASI", "Draft SPK No. 041/SPK/SBC/IX/2026 diterbitkan; sign Direktur menunggu approval CFO."],
    ["ACCOUNTING", "MENUNGGU", "Menunggu pencocokan nilai terbayar termin 1 dan 2 terhadap pembukuan."],
    ["HRD_GA", "TIDAK_DIPERLUKAN", null],
  ] as const) {
    await prisma.laneClearance.upsert({
      where: { submissionId_lane: { submissionId: subBanara188.id, lane } },
      update: {},
      create: { submissionId: subBanara188.id, lane, status, note: note ?? undefined },
    });
  }
  await prisma.gateDecision.create({
    data: { submissionId: subMarchand058.id, gate: 3, verdict: "RETURNED", comment: "C4-09 gagal: progres fisik pada BAPP melebihi pengesahan MK.", actorId: userByUsername.get("d.prasetya")!, decidedAt: new Date("2026-09-15T11:27:56") },
  });

  console.log("Seeding notifications...");
  const notifSeed: Array<[string, string, string, string | undefined, string]> = [
    ["SLA", "SLA Gate 3 terlampaui", "Adendum fasad Mazenta menunggu verifikasi anggaran 4 hari — melewati SLA 3 hari untuk kontrak. Notifikasi terkirim ke Kadiv Budget.", subMazenta041.id, "WARN"],
    ["SLA", "SLA Gate 3 terlampaui", "IOM pameran Q4 menunggu 6 hari — melewati SLA 2 hari untuk pengajuan biaya.", subBio317.id, "WARN"],
    ["STATUS", "Berkas masuk Gate 3", "Termin 3 struktur Tower A diteruskan dari verifikasi teknis & legal. Progres fisik disahkan MK pada 62,4%.", subBanara188.id, "INFO"],
    ["UMUR", "LOA lewat masa berlaku", "LOA-2026-003 PT Elektra Daya Nusantara belum dikonversi 52 hari sejak terbit. Status EXPIRED, dieskalasi otomatis ke CFO (C2-08).", undefined, "FAIL"],
    ["UMUR", "Jaminan mendekati kedaluwarsa", "Bank garansi uang muka BG-8841/2026 jatuh tempo H-18. Minta perpanjangan sebelum termin 4 diajukan (C5-11).", undefined, "WARN"],
    ["TAUTAN", "Tautan persetujuan kedaluwarsa", "Tautan pemberitahuan ke bayu.nugroho@ciptaharmoni.co.id mati tanpa dibuka. Perlu dikirim ulang.", undefined, "FAIL"],
    ["TAUTAN", "Tautan CEO Project menunggu", "Persetujuan Gate 4 terkirim ke johannes.tanuwijaya@ciptaharmoni.co.id. Pengingat otomatis pada H-2.", subTanglin184.id, "INFO"],
    ["STATUS", "Berkas dikembalikan", "Termin 2 lanskap Naraya dikembalikan ke pengaju — C4-02 gagal, progres keuangan melampaui progres fisik. Siklus return ke-1.", undefined, "FAIL"],
  ];
  for (const [category, title, body, submissionId, tagLevel] of notifSeed) {
    await prisma.notification.create({
      data: { category: category as never, title, body, submissionId, tagLevel: tagLevel as never, toUserId: headdept },
    });
  }

  console.log("Seeding activity log...");
  await prisma.activityLog.createMany({
    data: [
      { action: "LOGIN", note: "Login berhasil", userId: systemUserId },
      { action: "SUBMISSION_CREATED", note: `Berkas ${subBanara188.indexNo} dibuat`, userId: pengaju, submissionId: subBanara188.id },
      { action: "GATE_DECISION", note: `Gate 3 CLEAR WITH NOTES untuk ${subBanara188.indexNo}`, userId: userByUsername.get("d.prasetya")!, submissionId: subBanara188.id },
      { action: "SUBMISSION_RETURNED", note: `Berkas ${subMarchand058.indexNo} dikembalikan — C4-09 gagal`, userId: userByUsername.get("d.prasetya")!, submissionId: subMarchand058.id },
    ],
  });

  console.log("Seed complete.");
}

function parseIdDate(s: string): Date {
  // "18-09-2026 08:12" -> Date
  const [datePart, timePart] = s.split(" ");
  const [d, m, y] = datePart.split("-").map(Number);
  const [hh, mm] = (timePart ?? "00:00").split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

async function seedTermins(contractId: string, rows: Array<[string, number, "PAID" | "OPEN" | "PLAN", string | null]>) {
  for (const [label, amount, status, paidAt] of rows) {
    const existing = await prisma.paymentSchedule.findFirst({ where: { contractId, label } });
    if (existing) continue;
    await prisma.paymentSchedule.create({
      data: { contractId, label, amount, status, paidAt: paidAt ? new Date(paidAt) : undefined },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
