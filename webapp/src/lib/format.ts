const F = new Intl.NumberFormat("id-ID");

export function rp(n: number | string): string {
  const num = typeof n === "string" ? Number(n) : n;
  return (num < 0 ? "−" : "") + F.format(Math.round(Math.abs(num))) + (Number.isNaN(num) ? "" : "");
}

export function rupiah(n: number | string): string {
  return "Rp " + rp(n);
}

export function pct(n: number, decimals = 1): string {
  return n.toLocaleString("id-ID", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + "%";
}

export function dash(n: number): string {
  return Math.round(n) ? rp(n) : "-";
}

export function idDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const M = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${date.getDate()} ${M[date.getMonth()]} ${date.getFullYear()}`;
}

export function idDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${date.getFullYear()} ${hh}:${mi}`;
}

const SATUAN = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
function tb(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "";
  if (n < 12) return SATUAN[n] || "";
  if (n < 20) return tb(n - 10) + " belas";
  if (n < 100) return tb(Math.floor(n / 10)) + " puluh " + tb(n % 10);
  if (n < 200) return "seratus " + tb(n - 100);
  if (n < 1000) return tb(Math.floor(n / 100)) + " ratus " + tb(n % 100);
  if (n < 2000) return "seribu " + tb(n - 1000);
  if (n < 1e6) return tb(Math.floor(n / 1000)) + " ribu " + tb(n % 1000);
  if (n < 1e9) return tb(Math.floor(n / 1e6)) + " juta " + tb(n % 1e6);
  return tb(Math.floor(n / 1e9)) + " miliar " + tb(n % 1e9);
}

export function terbilang(n: number): string {
  const w = tb(n).replace(/\s+/g, " ").trim() || "nol";
  return w.charAt(0).toUpperCase() + w.slice(1) + " rupiah";
}
