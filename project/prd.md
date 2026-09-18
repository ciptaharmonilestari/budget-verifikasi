# PRD — Kendali Biaya Terpadu v1

**Produk:** Kendali Biaya Terpadu (KBT)
**Pemilik:** PT Cipta Harmoni Lestari
**Versi dokumen:** 1.0 · 18 September 2026
**Status:** prototipe fungsional, 26 layar, siap direview Finance & Direksi

---

## 1. Ringkasan

Kendali Biaya Terpadu menyatukan pengajuan biaya, verifikasi anggaran, pemeriksaan pajak dan legal, serta persetujuan berjenjang direksi ke dalam satu alur enam gate dengan jejak audit append-only.

Hari ini proses berjalan lewat memo tercetak, berkas Excel terpisah, dan rantai email. Akibatnya posisi anggaran tidak pernah diketahui real-time, komitmen (SPK/LOA/PO) baru tercatat saat tagihan masuk, dan rute persetujuan bergantung pada ingatan.

KBT v1 mencakup tiga ruang kerja (Pengaju, Budget, Penyetuju), sepuluh jenis berkas pengajuan, empat lembar dokumen cetak A4 berkop-bernomor-ber-QR, dan register parameter yang bisa diubah tanpa rilis ulang aplikasi. Seluruh antarmuka berbahasa Indonesia, satu desain responsif dari 390px sampai desktop lebar.

---

## 2. Masalah dan sasaran

| Masalah hari ini | Sasaran KBT v1 |
|---|---|
| Posisi anggaran hanya diketahui setelah tutup bulan | Pagu, komitmen, realisasi, sisa terlihat saat pengajuan dibuat |
| Komitmen tidak tercatat sampai tagihan masuk | Registri Commitment mencatat instrumen saat diterbitkan |
| Rute persetujuan ditentukan manual, sering salah tingkat | Matriks kewenangan memilih rute otomatis dari nilai berkas |
| Tarif pajak & ambang kontrak tertanam di kebiasaan kerja | Register parameter dengan usulan, persetujuan, tanggal berlaku |
| Dokumen cetak tidak seragam antar PT dan departemen | Empat lembar A4 berkop, bernomor indeks, ber-QR, bercap status |
| LOA dan jaminan kedaluwarsa tanpa peringatan | Aging Monitor memantau masa berlaku & liabilitas tak tercatat |

### Ukuran keberhasilan

**Belum ditetapkan — perlu konfirmasi Finance.** Kandidat yang diusulkan: waktu siklus pengajuan→keputusan per gate; persentase berkas yang kembali karena kelengkapan; selisih komitmen tercatat vs tagihan masuk; jumlah LOA lewat masa berlaku tanpa tindakan.

---

## 3. Pengguna dan peran

Akun demo tersedia untuk setiap peran di layar login.

| Peran | Ruang kerja | Wewenang utama |
|---|---|---|
| Owner | Budget | Akses penuh, master data, verifikasi |
| Head of Budget | Budget | Verifikasi Gate 3, master data, pengusul 4 grup parameter |
| Admin Budget | Budget | Input berkas; tidak boleh memverifikasi berkas yang ia input (BR-09) |
| Div Pajak | Budget | Verifikasi & validasi tarif; **satu-satunya** pengusul grup Tarif pajak |
| Pengaju departemen | Pengaju | Buat pengajuan, pantau berkas sendiri |
| Kepala departemen | Pengaju | Persetujuan departemen sebelum berkas masuk Budget |
| CEO Project | Penyetuju | Keputusan Gate 4 |
| CFO | Penyetuju | Keputusan Gate 5; penyetuju parameter |
| CEO 1 | Penyetuju | Keputusan Gate 6; penyetuju parameter bernilai >Rp 5 M |

**Aturan pemisahan tugas (BR-09):** akun yang menginput satu berkas tidak boleh menjadi verifikator berkas yang sama, walau berada dalam satu divisi.

---

## 4. Ruang lingkup — 26 layar

### Ruang kerja Budget (22 layar)

| Layar | Isi |
|---|---|
| Beranda | Ringkasan hari ini |
| Antrean Pengajuan | Submission queue (§6) |
| Lembar Verifikasi | Gate 3 · §10 |
| Review lewat Email | §5.5 · FR-002c |
| Master Departemen | FR-002a |
| Master PT & Proyek | FR-205 |
| Master Alokasi Budget | Pagu · terpakai · pindah |
| Lembar Perhitungan | DOC-04 · bobot & progres |
| Posisi Anggaran | §4.3 · 11 item Cost |
| Registri Commitment | FR-05 · instrumen |
| Monitoring Berkas | Indeks · status · revisi |
| Aging Monitor | FR-226 · LOA & jaminan |
| Panel Pajak | Verifikasi & validasi tarif |
| Lintasan Pajak & Legal | Verifikasi paralel |
| Alur Enam Gate | §9.1 · diagram |
| Status Lifecycle | §9.2 · state machine |
| Matriks Kewenangan | §11 · rute |
| Log Aktivitas | §5.4 · append-only |
| Notifications | FR-011 |
| User Management | FR-002b |
| Settings | FR-010 · ambang & tarif |
| Fondasi Desain | FR-234 · token |

### Ruang kerja Pengaju

Beranda · Buat Pengajuan (10 jenis berkas) · Berkas Saya · Lembar Perhitungan · Persetujuan Departemen (khusus kepala departemen) · Alur Enam Gate · Log Aktivitas

### Ruang kerja Penyetuju

Beranda · Antrean Keputusan (gate sesuai peran) · Lembar Verifikasi · Posisi Anggaran · Aging Monitor · Matriks Kewenangan · Settings · Log Aktivitas

---

## 5. Alur enam gate

1. **Gate 1 — Kelengkapan.** Berkas & lampiran wajib.
2. **Gate 2 — Teknis & legal.** Pemeriksaan paralel pajak dan legal.
3. **Gate 3 — Verifikasi Budget.** Lembar Verifikasi; dampak ke pagu dihitung.
4. **Gate 4 — CEO Project.**
5. **Gate 5 — CFO.**
6. **Gate 6 — CEO 1.**

Rute ditentukan matriks kewenangan berdasarkan nilai berkas. Setiap gate punya SLA yang bisa dikonfigurasi (lihat §7). Penolakan mengembalikan berkas ke pengaju dengan batas jumlah siklus pengembalian.

### Batas kewenangan (nilai berlaku saat ini)

| Tingkat | Batas | Penyetuju |
|---|---|---|
| 1 | ≤ Rp 50 juta | Sesuai matriks |
| 2 | ≤ Rp 250 juta | Sesuai matriks |
| 3 | ≤ Rp 1 miliar | CEO mulai masuk |
| 4 | ≤ Rp 5 miliar | CFO / CEO 1 |
| RUPS | > batas tingkat 4 | BoD / Komisaris — **belum diisi, wajib dilengkapi** |

---

## 6. Jenis berkas pengajuan

Sepuluh jenis, masing-masing dengan formulir dan naskah dokumennya sendiri. Yang utama:

- **IOM Pengajuan Biaya** — biaya operasional non-kontrak
- **IOM Penunjukan** — SPK / LOA, dengan plafon dan masa berlaku
- **IOM Payment (BAPP)** — berita acara progres pekerjaan, bobot per item, uang muka, retensi
- **IOM Finance (Payment Voucher)** — instruksi bayar
- **Pengajuan DPH** — daftar pembayaran harian
- **Pengajuan Pajak** — setoran dan pelaporan

Nomor indeks terbit otomatis dengan format `NNN/PT-PROYEK-DEPT/BULAN-ROMAWI/TAHUN`.

---

## 7. Modul Settings — parameter yang bisa diubah

Register parameter menggantikan konstanta di kode: setiap keputusan Finance atau CFO tidak lagi memerlukan rilis ulang.

### 7.1 Wewenang mengusulkan

| Grup parameter | Pengusul |
|---|---|
| Tarif pajak | **Div Pajak — hanya mereka** |
| Tingkat kewenangan | Head of Budget |
| Ambang kontrak | Head of Budget |
| Ambang deviasi | Head of Budget |
| SLA & masa berlaku | Head of Budget |

Tidak ada peran "Admin Konfigurasi" — keputusan eksplisit agar wewenang tetap pada pemilik modul.

### 7.2 Alur perubahan

1. Pengusul mengisi nilai baru **inline di baris**, beserta tanggal mulai berlaku dan dasar usulan.
2. Baris menampilkan nilai berlaku di atas dan badge **"usulan menunggu"** dengan nilai baru di bawahnya — bukan tab terpisah, bukan Antrean Keputusan.
3. Penyetuju mengikuti matriks kewenangan yang sudah ada: **CFO (Gate 5)**, naik ke **CEO 1** bila nilai parameter melewati Rp 5 miliar.
4. Penyetuju boleh **menggeser tanggal mulai berlaku**, atau **menolak dengan alasan wajib**.
5. Perubahan yang disetujui langsung menjadi nilai berlaku dan tercatat di riwayat.

### 7.3 Jalur langsung CFO/CEO

CFO dan CEO 1 boleh mengubah nilai **tanpa usulan**, di desktop maupun ponsel, dengan syarat mengisi alasan. Tercatat di riwayat sebagai **"perubahan langsung"** agar audit bisa membedakannya dari perubahan yang melewati persetujuan.

### 7.4 Antarmuka

- Riwayat per parameter (nilai lama → baru, pelaku, tanggal, alasan) dibuka sebagai **panel geser** dari kanan
- Baris "belum diisi" ditandai merah dan berlabel **wajib dilengkapi**
- Tombol **kembalikan ke nilai sebelumnya**, muncul hanya bila ada perubahan yang sudah berlaku
- Tombol **kembalikan semua ke data contoh**
- Seluruh rentang validasi ditandai **belum dikonfirmasi Finance**

### 7.5 Perilaku di ponsel 390px — khusus layar Settings

- Tabel menyisakan kolom inti: Parameter · Nilai berlaku · Status
- **Hanya CFO dan CEO 1 punya akses tulis**, lewat halaman detail parameter (bukan inline): setujui/tolak usulan, geser tanggal, ubah nilai langsung, kembalikan nilai sebelumnya
- **Head of Budget & Div Pajak read-only di ponsel** — mengusulkan hanya dari desktop; tombol ubah disembunyikan dengan catatan penjelas
- Aturan ini **khusus Settings**; fitur lain (BAPP, IOM Penunjukan, dll) mengikuti kesepakatannya masing-masing

### 7.6 Rentang validasi

> **PERLU DIKONFIRMASI FINANCE.** Angka di bawah adalah usulan sistem, ditandai jelas sebagai belum final di dalam UI. Angka resmi dari Finance akan menggantikannya.

| Grup | Parameter | Rentang usulan |
|---|---|---|
| Tingkat kewenangan | Batas tingkat 1–4, batas RUPS | Rp 0 – 100 M, **wajib menaik** (batas 1 < 2 < 3 < 4) |
| Tarif pajak | PPN | 0 – 15% |
| | PPh final jasa konstruksi (SBU K1/K2) | 0 – 20% |
| | PPh 23 jasa lain | 0 – 20% |
| Ambang kontrak | Uang muka maksimum | 0 – 30% nilai kontrak |
| | Retensi minimum | 0 – 10% |
| | Plafon denda | 0 – 20% nilai kontrak |
| | Batas kumulatif adendum | 0 – 30% nilai kontrak awal |
| Ambang deviasi | Deviasi terhadap OE/HPS | 0 – 20% |
| | Jendela deteksi pemecahan nilai | 1 – 180 hari kalender |
| SLA & masa berlaku | SLA tiap gate | 1 – 30 hari kerja |
| | Masa berlaku LOA | 7 – 180 hari kalender |
| | Timeout sesi tanpa aktivitas | 5 – 120 menit |
| | Maksimum siklus pengembalian | 1 – 5 siklus |

Validasi menaik berlaku silang antar baris: mengisi Rp 30 juta pada Batas tingkat 2 ditolak dengan pesan "Harus lebih besar dari Batas tingkat 1".

---

## 8. Dokumen cetak

Empat lembar A4, semuanya siap cetak dari pratinjau di dalam aplikasi.

| Lembar | Orientasi |
|---|---|
| Memo / IOM | A4 tegak |
| Ringkasan pembayaran | A4 tegak |
| DPH (daftar pembayaran harian) | A4 tegak |
| Rekapitulasi BAPP | A4 lanskap |

### Ketentuan

- **Kop seragam** — nama PT operasional per berkas (Serpong Bangun Cipta, dst.). Logo induk Cipta Harmoni Lestari **tidak dicetak**; identitas dokumen mengikuti PT-nya saja.
- **Nomor & QR** — QR berisi URL berkas di sistem (`kbt.ciptaharmoni.com/b/<nomor indeks>`), digenerate offline tanpa layanan luar. Tidak ada teks nomor/URL di bawah QR.
- **Blok tanda tangan berjenjang** — kolom terbit otomatis dari matriks kewenangan sesuai gate berkas, ditambah tombol sisip kolom manual. Jumlah kolom tidak dipatok; saat 5–6 kolom, blok membungkus ke baris kedua.
- **Cap status** — DRAF / FINAL / LUNAS / VOID, dipilih di toolbar pratinjau.
- **Footer halaman** — "hal. x dari y" per halaman, dihitung saat cetak.
- **Paginasi A4** — lembar dipecah ke halaman 178×265mm; baris tabel dan blok tanda tangan tidak terpotong antar halaman; header tabel berulang.

> Catatan operasional: matikan header/footer bawaan browser di dialog cetak agar penomoran halaman tidak dobel.

---

## 9. Responsivitas

Satu desain responsif, bukan dua versi terpisah. Struktur shell sepenuhnya dari media query.

| Lebar | Perilaku |
|---|---|
| ≤ 1180px | Sidebar menyusut jadi rel ikon 64px; label nav disembunyikan |
| ≤ 1024px | Pencarian header disembunyikan |
| ≤ 900px | Sidebar jadi drawer melayang + scrim; header jadi tombol menu + judul layar (notifikasi & akun jadi ikon); grid 2/3 kolom runtuh jadi satu kolom |

### Tabel padat di ponsel

44 tabel menyisakan kolom inti; sisanya dibuka lewat **halaman detail penuh dengan tombol kembali** (ketuk baris). Pilihan ini lebih baik daripada geser horizontal untuk tabel selebar antrean dan registri.

### Form panjang di ponsel

Satu kolom penuh, dengan action bar utama **menempel di bawah layar** (Buat Pengajuan, Lembar Verifikasi).

### Target sentuh

Minimum 44px pada seluruh tombol aksi di ponsel.

---

## 10. Data dan penyimpanan

Prototipe v1 tidak memiliki backend. Data contoh tertanam di aplikasi dan dipertahankan apa adanya — bukan placeholder — agar review Finance berlangsung atas angka yang realistis.

Perubahan parameter tersimpan di browser (`localStorage`) sehingga bertahan setelah refresh. Nilai dasar tetap data contoh; perubahan hanya menimpanya, jadi tombol "kembalikan semua ke data contoh" selalu bisa memulihkan keadaan awal.

Untuk produksi, seluruh nilai parameter, riwayat, dan usulan harus pindah ke basis data dengan audit trail append-only yang sama.

---

## 11. Di luar lingkup v1

- Integrasi ke sistem akuntansi / ERP
- Otentikasi nyata (SSO, 2FA) — v1 memakai akun demo
- Unggah dan penyimpanan lampiran berkas
- Notifikasi email/WhatsApp keluar (layar Notifications hanya menampilkan)
- Laporan konsolidasi multi-PT
- Aplikasi native; v1 adalah web responsif
- Restyle ke sistem desain lain — palet krem/emas/biru dipertahankan atas keputusan pemilik produk

---

## 12. Log keputusan

Keputusan yang diambil selama perancangan, beserta alasannya.

| # | Keputusan | Alasan |
|---|---|---|
| 1 | Satu desain responsif, bukan versi mobile terpisah | Menghindari dua basis kode yang harus disinkronkan |
| 2 | Struktur shell dari CSS media query, bukan state aplikasi | Mencegah desync antara rel ikon dan drawer |
| 3 | Tombol menu disembunyikan di 901–1180px | Di band itu rel ikon sudah merupakan bentuk terkompresnya |
| 4 | Tabel ponsel: kolom inti + halaman detail penuh | Lebih terbaca daripada geser horizontal pada tabel lebar |
| 5 | Logo induk tidak dicetak di dokumen | Identitas dokumen mengikuti PT operasional, bukan induk |
| 6 | Wordmark dibatasi lebar, bukan tinggi | Rasio wordmark sangat lebar; pembatasan tinggi membuat kop membengkak |
| 7 | QR berisi URL berkas, tanpa teks di bawahnya | Pemindaian sudah cukup; teks menambah keramaian kop |
| 8 | QR digenerate offline di dalam aplikasi | Dokumen harus bisa dicetak tanpa koneksi keluar |
| 9 | Kolom tanda tangan otomatis dari matriks + sisip manual | Jumlah penandatangan berbeda per jenis dokumen |
| 10 | Parameter: usulan → persetujuan, bukan langsung berlaku | Perubahan ambang dan tarif berdampak lintas berkas |
| 11 | Penyetuju parameter mengikuti matriks kewenangan yang ada | Menghindari matriks kedua yang harus dirawat terpisah |
| 12 | Tarif pajak hanya boleh diusulkan Div Pajak | Kompetensi teknis perpajakan ada di sana |
| 13 | Tidak ada peran "Admin Konfigurasi" | Wewenang tetap pada pemilik modul masing-masing |
| 14 | Usulan tampil di baris parameter, bukan tab/antrean terpisah | Konteks nilai berlaku dan nilai usulan harus terlihat bersama |
| 15 | Riwayat sebagai panel geser | Tidak mengganggu posisi baca di tabel panjang |
| 16 | Jalur langsung CFO/CEO wajib beralasan | Memberi kelenturan operasional tanpa kehilangan jejak audit |
| 17 | Di ponsel, Settings hanya bisa ditulis CFO/CEO | Mengusulkan perlu ketelitian; keputusan cepat perlu mobilitas |
| 18 | Perubahan parameter tersimpan di browser | Review multi-sesi tanpa backend |
| 19 | Rentang validasi ditandai belum final di UI | Angka resmi belum diberikan Finance |
| 20 | Data contoh dipertahankan, tidak diganti placeholder | Review Finance perlu angka yang realistis |

---

## 13. Pertanyaan terbuka

1. **Rentang validasi resmi** untuk kelima grup parameter — menunggu angka dari Finance (§7.6).
2. **Batas RUPS** (BoD / Komisaris) masih kosong dan ditandai wajib dilengkapi.
3. **Ukuran keberhasilan** produk belum ditetapkan (§2).
4. Apakah **jalur langsung CFO/CEO** perlu batas nilai, atau berlaku untuk seluruh grup tanpa plafon.
5. Apakah **nomor indeks** perlu dicadangkan saat draf dibuat, atau tetap terbit saat berkas dikirim.
6. Kebijakan **retensi riwayat** parameter — berapa lama entri lama disimpan.

---

## 14. Lampiran — berkas proyek

| Berkas | Isi |
|---|---|
| `Kendali Biaya Terpadu.dc.html` | Prototipe 26 layar |
| `assets/logo-chl.png` | Wordmark induk (dipakai di layar login) |
| `assets/logo-alt.png` | Logo header aplikasi |
| `qr.js` | Encoder QR offline (byte mode, EC-M, versi 1–10) |
| `CLAUDE.md` | Catatan implementasi & keputusan untuk sesi berikutnya |
| `prd.md` | Dokumen ini |
