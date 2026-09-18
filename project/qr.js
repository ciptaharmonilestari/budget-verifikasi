// Minimal QR encoder — byte mode, EC level M, versions 1-10. Returns an SVG data URI.
const EC_M = [
  null,
  { total: 26, data: 16, ec: 10, groups: [[1, 16]] },
  { total: 44, data: 28, ec: 16, groups: [[1, 28]] },
  { total: 70, data: 44, ec: 26, groups: [[1, 44]] },
  { total: 100, data: 64, ec: 18, groups: [[2, 32]] },
  { total: 134, data: 86, ec: 24, groups: [[2, 43]] },
  { total: 172, data: 108, ec: 16, groups: [[4, 27]] },
  { total: 196, data: 124, ec: 18, groups: [[4, 31]] },
  { total: 242, data: 154, ec: 22, groups: [[2, 38], [2, 39]] },
  { total: 292, data: 182, ec: 22, groups: [[3, 36], [2, 37]] },
  { total: 346, data: 216, ec: 26, groups: [[4, 43], [1, 44]] }
];
const ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

const EXP = new Array(512), LOG = new Array(256);
(function () {
  let x = 1;
  for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();
const mul = (a, b) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

function ecPoly(n) {
  let p = [1];
  for (let i = 0; i < n; i++) {
    const q = [1, EXP[i]], r = new Array(p.length + 1).fill(0);
    for (let j = 0; j < p.length; j++) for (let k = 0; k < 2; k++) r[j + k] ^= mul(p[j], q[k]);
    p = r;
  }
  return p;
}
function ecBytes(data, ecLen) {
  const gen = ecPoly(ecLen), res = data.concat(new Array(ecLen).fill(0));
  for (let i = 0; i < data.length; i++) {
    const c = res[i];
    if (!c) continue;
    for (let j = 0; j < gen.length; j++) res[i + j] ^= mul(gen[j], c);
  }
  return res.slice(data.length);
}
function bch(value, poly, bits) {
  let v = value << bits;
  const deg = poly.toString(2).length - 1;
  while (v.toString(2).length - 1 >= deg + 0 && v >>> deg) {
    const shift = (v.toString(2).length - 1) - deg;
    if (shift < 0) break;
    v ^= poly << shift;
  }
  return v;
}

export function qrMatrix(text) {
  const bytes = Array.from(new TextEncoder().encode(text));
  let ver = 0;
  for (let v = 1; v <= 10; v++) {
    const lenBits = v < 10 ? 8 : 16;
    if (4 + lenBits + bytes.length * 8 <= EC_M[v].data * 8) { ver = v; break; }
  }
  if (!ver) throw new Error('QR: data too long');
  const spec = EC_M[ver], lenBits = ver < 10 ? 8 : 16;

  const bits = [];
  const push = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >> i) & 1); };
  push(4, 4); push(bytes.length, lenBits);
  bytes.forEach((b) => push(b, 8));
  const cap = spec.data * 8;
  for (let i = 0; i < 4 && bits.length < cap; i++) bits.push(0);
  while (bits.length % 8) bits.push(0);
  const pad = [0xec, 0x11];
  let pi = 0;
  const dataCw = [];
  for (let i = 0; i < bits.length; i += 8) dataCw.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  while (dataCw.length < spec.data) dataCw.push(pad[pi++ % 2]);

  const blocks = [];
  let off = 0;
  spec.groups.forEach(([count, size]) => {
    for (let i = 0; i < count; i++) { blocks.push(dataCw.slice(off, off + size)); off += size; }
  });
  const ecs = blocks.map((b) => ecBytes(b, spec.ec));
  const maxLen = Math.max.apply(null, blocks.map((b) => b.length));
  const final = [];
  for (let i = 0; i < maxLen; i++) blocks.forEach((b) => { if (i < b.length) final.push(b[i]); });
  for (let i = 0; i < spec.ec; i++) ecs.forEach((e) => final.push(e[i]));

  const size = 17 + ver * 4;
  const m = [], fn = [];
  for (let i = 0; i < size; i++) { m.push(new Array(size).fill(0)); fn.push(new Array(size).fill(0)); }
  const setF = (r, c, v) => { m[r][c] = v; fn[r][c] = 1; };

  const finder = (r0, c0) => {
    for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) {
      const rr = r0 + r, cc = c0 + c;
      if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
      const on = (r >= 0 && r <= 6 && (c === 0 || c === 6)) || (c >= 0 && c <= 6 && (r === 0 || r === 6)) || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
      setF(rr, cc, on ? 1 : 0);
    }
  };
  finder(0, 0); finder(0, size - 7); finder(size - 7, 0);
  for (let i = 8; i < size - 8; i++) { setF(6, i, i % 2 === 0 ? 1 : 0); setF(i, 6, i % 2 === 0 ? 1 : 0); }
  ALIGN[ver].forEach((r) => ALIGN[ver].forEach((c) => {
    if ((r === 6 && c === 6) || (r === 6 && c === size - 7) || (r === size - 7 && c === 6)) return;
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
      const on = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
      setF(r + dr, c + dc, on ? 1 : 0);
    }
  }));
  setF(size - 8, 8, 1);
  for (let i = 0; i < 9; i++) { if (!fn[8][i]) setF(8, i, 0); if (!fn[i][8]) setF(i, 8, 0); }
  for (let i = 0; i < 8; i++) { if (!fn[8][size - 1 - i]) setF(8, size - 1 - i, 0); if (!fn[size - 1 - i][8]) setF(size - 1 - i, 8, 0); }
  if (ver >= 7) {
    for (let i = 0; i < 18; i++) { setF(size - 11 + (i % 3), Math.floor(i / 3), 0); setF(Math.floor(i / 3), size - 11 + (i % 3), 0); }
  }

  // data placement
  let bi = 0;
  const dataBits = [];
  final.forEach((b) => { for (let i = 7; i >= 0; i--) dataBits.push((b >> i) & 1); });
  let up = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let n = 0; n < size; n++) {
      const row = up ? size - 1 - n : n;
      for (let k = 0; k < 2; k++) {
        const c = col - k;
        if (fn[row][c]) continue;
        m[row][c] = bi < dataBits.length ? dataBits[bi++] : 0;
      }
    }
    up = !up;
  }

  const maskFn = [
    (r, c) => (r + c) % 2 === 0,
    (r) => r % 2 === 0,
    (r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0
  ];
  function penalty(g) {
    let p = 0;
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
      if (r + 1 < size && c + 1 < size) {
        const v = g[r][c];
        if (v === g[r][c + 1] && v === g[r + 1][c] && v === g[r + 1][c + 1]) p += 3;
      }
    }
    for (let r = 0; r < size; r++) {
      let run = 1;
      for (let c = 1; c < size; c++) {
        if (g[r][c] === g[r][c - 1]) { run++; if (run === 5) p += 3; else if (run > 5) p += 1; }
        else run = 1;
      }
    }
    for (let c = 0; c < size; c++) {
      let run = 1;
      for (let r = 1; r < size; r++) {
        if (g[r][c] === g[r - 1][c]) { run++; if (run === 5) p += 3; else if (run > 5) p += 1; }
        else run = 1;
      }
    }
    return p;
  }

  let best = null, bestMask = 0, bestPen = Infinity;
  for (let mk = 0; mk < 8; mk++) {
    const g = m.map((row, r) => row.map((v, c) => (fn[r][c] ? v : (maskFn[mk](r, c) ? v ^ 1 : v))));
    // format info (EC level M = 0b00)
    const fmt = ((0 << 3) | mk);
    const bits15 = ((fmt << 10) | bch(fmt, 0x537, 10)) ^ 0x5412;
    const put = (r, c, v) => { g[r][c] = v; };
    for (let i = 0; i < 15; i++) {
      const bit = (bits15 >> i) & 1;
      if (i < 6) put(8, i, bit);
      else if (i < 8) put(8, i + 1, bit);
      else if (i === 8) put(7, 8, bit);
      else put(14 - i, 8, bit);
      if (i < 8) put(size - 1 - i, 8, bit);
      else put(8, size - 15 + i, bit);
    }
    put(size - 8, 8, 1);
    if (ver >= 7) {
      const vb = (ver << 12) | bch(ver, 0x1f25, 12);
      for (let i = 0; i < 18; i++) {
        const bit = (vb >> i) & 1;
        put(size - 11 + (i % 3), Math.floor(i / 3), bit);
        put(Math.floor(i / 3), size - 11 + (i % 3), bit);
      }
    }
    const pen = penalty(g);
    if (pen < bestPen) { bestPen = pen; best = g; bestMask = mk; }
  }
  return best;
}

export function qrSvgDataUri(text, opts) {
  const o = opts || {};
  const quiet = o.quiet == null ? 2 : o.quiet;
  const m = qrMatrix(text);
  const n = m.length, dim = n + quiet * 2;
  let path = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (m[r][c]) path += 'M' + (c + quiet) + ' ' + (r + quiet) + 'h1v1h-1z';
  }
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + dim + ' ' + dim + '" shape-rendering="crispEdges">' +
    '<rect width="' + dim + '" height="' + dim + '" fill="#fff"/><path d="' + path + '" fill="#111"/></svg>';
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
