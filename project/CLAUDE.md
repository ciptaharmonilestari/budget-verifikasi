# Kendali Biaya Terpadu — instruksi proyek

Deliverable utama: `Kendali Biaya Terpadu.dc.html` (26 layar, dibongkar dari bundel unggahan user).
Aset: `assets/logo-chl.png`, `assets/logo-alt.png`, `qr.js` (encoder QR offline, byte mode, EC-M, versi 1–10).

## Sudah dikerjakan

**Responsif (satu desain, bukan dua versi).** Layout shell sepenuhnya dari `@media` — jangan pernah mencerminkan lebar viewport ke state React. State hanya menyimpan `drawer` (buka/tutup) dan `sideOpen` (preferensi rel desktop); `toggleSide` membaca `matchMedia` saat diklik.
- ≤1180px: sidebar jadi rel ikon 64px (`.kbt-navtext` disembunyikan), tombol menu disembunyikan (`.kbt-menubtn`) karena rel sudah bentuk terkompresnya
- ≤1024px: pencarian header disembunyikan (`.kbt-hide-tablet`)
- ≤900px: sidebar jadi drawer melayang + scrim, header jadi tombol menu + judul layar, grid 2/3 kolom runtuh, 44 tabel (`.kbt-tbl`) menyisakan kolom inti dan ketuk baris membuka halaman detail penuh, form Buat Pengajuan dapat action bar menempel
- Label nav selalu ada di markup, disembunyikan lewat CSS — jangan pakai `<sc-if>` untuk ini (bikin desync rel vs drawer)

**Dokumen cetak A4.** Empat lembar (memo/IOM, ringkasan pembayaran, DPH, BAPP lanskap) berkop seragam: wordmark dibatasi **lebar** (126/116/110/104px, `height:auto`) — jangan pakai `height:` pada logo, rasionya sangat lebar dan bikin kop 260px. QR berisi `kbt.ciptaharmoni.com/b/<nomor indeks>`. Cap status DRAF/FINAL/LUNAS/VOID dipilih di toolbar pratinjau. Saat cetak, `paginate()` memecah lembar ke halaman A4 (178×265mm) dengan footer "hal. x dari y"; `unpaginate()` memulihkan DOM. Wordmark dan nama PT bukan duplikat — wordmark = induk (Cipta Harmoni Lestari), teks = PT operasional per berkas.

## Settings/Parameter bisa diubah — SUDAH dikerjakan

Tersimpan di `localStorage['kbt.settings.params.v1']` = `{over, prop, hist}` — jangan sentuh entri localStorage lain. Data contoh `const SETTINGS` tetap jadi nilai dasar; `over` hanya menimpanya. Metadata ada di `PARAM_META` (satuan + rentang + urutan menaik) dan `PARAM_OWNER`. Layar Settings kini juga ada di `NAV_APPROVER` supaya CFO/CEO bisa menyetujui. Akun demo baru: `f.maharani` (Div Pajak).

Kolom inti tabel di ponsel dipilih lewat `data-kbt-core="0,1,3"` pada `<sc-raw-table>` (override heuristik `markTables()`); ketuk baris `tr[data-kbt-param]` membuka halaman detail parameter, bukan `rowDetail` generik.

Spesifikasi yang diterapkan:

**Wewenang mengusulkan**
| Grup | Pengusul |
|---|---|
| Tarif pajak | Div Pajak (peran baru) — hanya mereka |
| Tingkat kewenangan | Head of Budget |
| Ambang kontrak | Head of Budget |
| Ambang deviasi | Head of Budget |
| SLA & masa berlaku | Head of Budget |

Tidak perlu peran "Admin Konfigurasi".

**Alur.** Simpan sebagai usulan → penyetuju mengikuti matriks kewenangan yang sudah ada (CFO Gate 5; naik ke CEO 1 bila nilai parameter >Rp 5 M) → baru berlaku. CFO/CEO boleh **menolak dengan alasan wajib**. Tanggal mulai berlaku diisi pengusul, penyetuju boleh menggesernya.

**Jalur langsung.** CFO/CEO boleh mengubah nilai langsung tanpa usulan — di ponsel **dan** desktop — tapi wajib isi alasan, dan tercatat di riwayat sebagai "perubahan langsung".

**UI**
- Nilai baru diisi **inline** di baris (desktop)
- Usulan menunggu: baris menampilkan nilai berlaku + badge "usulan menunggu" dengan nilai baru di bawahnya (bukan tab terpisah, bukan Antrean Keputusan)
- Riwayat per parameter (nilai lama → baru) dibuka sebagai **panel geser**
- Baris "belum diisi" ditandai wajib dilengkapi
- Tombol kembalikan ke nilai sebelumnya
- Tombol "kembalikan semua ke data contoh" di layar Settings
- Perubahan **tersimpan di browser** (bertahan setelah refresh) — jangan sentuh entri localStorage yang bukan milik fitur ini

**Ponsel 390px — khusus layar Settings/Parameter**
- Hanya CFO dan CEO punya akses tulis, lewat **halaman detail parameter** (bukan inline): setujui/tolak usulan, geser tanggal, ubah nilai langsung, kembalikan nilai sebelumnya
- Head of Budget & Div Pajak **read-only di ponsel** — mengusulkan hanya dari desktop; tombol ubah disembunyikan
- Tampilkan catatan singkat kenapa tombol ubah tidak ada
- Aturan ini **hanya** untuk Settings. Fitur lain (BAPP, IOM Penunjukan, dll) tetap sesuai kesepakatan masing-masing.

**Rentang validasi — usulan saya, PERLU DIKONFIRMASI FINANCE.** Tandai jelas di UI sebagai belum final; user akan memberi angka resminya.
- Tingkat kewenangan: batas 1 < batas 2 < batas 3 < batas 4 (Rp 50 jt / 250 jt / 1 M / 5 M), masing-masing Rp 0–100 M, wajib menaik
- Tarif pajak: PPN 0–15%, PPh 21/22/23 0–20%, PPh final 0–20%, PPh 4(2) konstruksi 0–10%
- Ambang kontrak: nilai minimum SPK Rp 0–5 M; retensi 0–10%; uang muka 0–30%
- Ambang deviasi: toleransi realisasi vs BOQ 0–20%; ambang eskalasi 0–50%
- SLA & masa berlaku: SLA tiap gate 1–30 hari kerja; masa berlaku penawaran 7–180 hari; masa berlaku BOQ 30–730 hari

## Aturan kerja di proyek ini

- User berbahasa Indonesia — semua UI, copy, dan balasan chat dalam bahasa Indonesia
- Data contoh yang ada dipertahankan; jangan ganti dengan placeholder
- Satu file DC; jangan pecah jadi komponen anak
- Palet krem/emas/biru asli dipertahankan — user menolak restyle ke sistem desain lain
