/**
 * Nav / section icons — path data ported verbatim from the prototype's
 * ICONS map (dc.html) so the app keeps the same pictograms. 256x256 viewBox,
 * stroke-based line icons (Phosphor "regular" style).
 */
export const ICON_PATHS: Record<string, string> = {
  dasbor: "M40 40h72v64H40zM144 40h72v40h-72zM40 136h72v80H40zM144 112h72v104h-72z",
  antrean: "M88 64h128M88 128h128M88 192h128M40 64h16M40 128h16M40 192h16",
  buat: "M128 40v176M40 128h176",
  verifikasi: "M208 40H48a8 8 0 00-8 8v160a8 8 0 008 8h160a8 8 0 008-8V48a8 8 0 00-8-8zM96 128l24 24 48-48",
  email: "M224 56H32v144h192zM32 56l96 88 96-88",
  dept: "M96 32H40a8 8 0 00-8 8v176h72zm120 72h-56v112h64V112a8 8 0 00-8-8zM64 88h8m-8 40h8m-8 40h8",
  pt: "M32 216h192M56 216V64l72-32 72 32v152M96 104h16m32 0h16m-64 48h16m32 0h16",
  log: "M96 56h120M96 128h120M96 200h120M40 56l16 16 24-32M40 128l16 16 24-32M40 200l16 16 24-32",
  notif: "M96 208a32 32 0 0064 0M56 104a72 72 0 01144 0c0 45 15 62 20 70H36c5-8 20-25 20-70z",
  users: "M100 144a44 44 0 100-88 44 44 0 000 88zM24 208a84 84 0 01152 0M188 72h48m-24-24v48",
  settings: "M128 168a40 40 0 100-80 40 40 0 000 80zM128 24l14 30 33-6 6 33 30 14-14 33 21 26-26 21 6 33-33 6-14 30-33-14-26 21-21-26-33 6 6-33-30-14 14-33-21-26 26-21-6-33 33 6z",
  fondasi: "M48 40h160v56H48zM48 128h72v88H48zM152 128h56v88h-56z",
  alokasi: "M32 56h192v56H32zM32 144h84v56H32zM140 144h84v56h-84z",
  berkas: "M32 72h64l24 32h104v112H32z",
  keputusan: "M40 88h176M40 88l-16 48a48 48 0 0096 0zM216 88l-16 48a48 48 0 0096 0M128 40v144M88 216h80",
  perhitungan: "M56 24h144v208H56zM88 64h80M88 112h24m32 0h24M88 160h24m32 0h24M88 200h80",
  posisi: "M40 216V96M104 216V40M168 216v-88M232 216H24",
  registri: "M56 32h112l40 40v152H56zM88 104h96M88 144h96M88 184h56",
  monitor: "M32 64h192v128H32zM72 224h112M128 192v32M72 128l32-32 24 24 40-48",
  aging: "M128 40a88 88 0 1088 88M128 80v48l32 24M176 32l32 24M120 216h16",
  pajak: "M72 72h.1M184 184h.1M64 192L192 64",
  lintasan: "M40 64h64a40 40 0 0140 40v48a40 40 0 0040 40h32M40 192h64M184 40l32 24-32 24M184 168l32 24-32 24",
  gates: "M32 128h48m32 0h48m32 0h48M96 104v48M176 104v48M32 96v64M224 96v64",
  lifecycle: "M72 56a88 88 0 11-24 96M40 40v48h48M128 88v48h40",
  authority: "M40 40h72v72H40zM144 40h72v72h-72zM40 144h72v72H40zM144 144h72v72h-72z",
  approvaldept: "M40 88h176M40 88l-16 48a48 48 0 0096 0zM216 88l-16 48a48 48 0 0096 0M128 40v144M88 216h80",
  menu: "M40 64h176M40 128h176M40 192h176",
  close: "M56 56l144 144M200 56L56 200",
  back: "M164 40L84 128l80 88",
  search: "M116 196a80 80 0 1080-80 80 80 0 00-80 80zM224 224l-46.4-46.4",
};

export function Icon({ name, size = 20, className }: { name: string; size?: number; className?: string }) {
  const d = ICON_PATHS[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      stroke="currentColor"
      strokeWidth={14}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
