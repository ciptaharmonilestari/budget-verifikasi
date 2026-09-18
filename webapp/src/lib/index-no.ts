const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

/** Official document number format per prd.md §6: NNN/PT-PROYEK-DEPT/BULAN-ROMAWI/TAHUN. */
export function formatIndexNo(nnn: number, ptCode: string, projectName: string, deptCode: string, date: Date): string {
  const roman = ROMAN[date.getMonth() + 1];
  return `${String(nnn).padStart(3, "0")}/${ptCode}-${projectName}-${deptCode}/${roman}/${date.getFullYear()}`;
}
