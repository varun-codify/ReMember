/**
 * Generates the ReMember PWA icons (PNG) using only Node built-ins.
 *
 * Neo-brutalist mark: coral background, yellow corner block, thick dark
 * border, and a white checkmark. Run from client/ with:
 *
 *   node scripts/generate-icons.js
 *
 * Outputs public/logo192.png and public/logo512.png.
 */
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

/* ---------- Minimal PNG encoder (no dependencies) ---------- */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePNG(width, height, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filter: none
    rgba.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([signature, pngChunk('IHDR', ihdr), pngChunk('IDAT', idat), pngChunk('IEND', Buffer.alloc(0))]);
}

/* ---------- Drawing ---------- */

const CORAL = [255, 107, 107];
const YELLOW = [254, 202, 87];
const INK = [44, 24, 16]; // dark border color
const WHITE = [255, 255, 255];

// Distance from point (px, py) to segment AB.
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// White checkmark polyline (normalized coordinates).
const CHECK = [
  [0.26, 0.54],
  [0.43, 0.71],
  [0.76, 0.30],
];

function pixelColor(x, y, size) {
  const nx = x / size;
  const ny = y / size;

  // Yellow corner block (top-right).
  if (nx > 0.72 && ny < 0.28) {
    return YELLOW;
  }

  // Checkmark.
  const stroke = 0.115;
  for (let i = 0; i < CHECK.length - 1; i++) {
    const [ax, ay] = CHECK[i];
    const [bx, by] = CHECK[i + 1];
    if (distToSegment(nx, ny, ax, ay, bx, by) <= stroke) {
      return WHITE;
    }
  }

  // Coral background.
  return CORAL;
}

function renderIcon(size) {
  const rgba = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixelColor(x, y, size);
      const i = (y * size + x) * 4;
      rgba[i] = r;
      rgba[i + 1] = g;
      rgba[i + 2] = b;
      rgba[i + 3] = 255;
    }
  }

  // Thick dark border drawn on top (keeps the brutalist outline crisp).
  const borderW = Math.max(2, Math.round(size * 0.055));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nearEdge =
        x < borderW || y < borderW || x >= size - borderW || y >= size - borderW;
      if (nearEdge) {
        const i = (y * size + x) * 4;
        rgba[i] = INK[0];
        rgba[i + 1] = INK[1];
        rgba[i + 2] = INK[2];
        rgba[i + 3] = 255;
      }
    }
  }

  return encodePNG(size, size, rgba);
}

const outDir = path.join(__dirname, '..', 'public');
fs.mkdirSync(outDir, { recursive: true });

const targets = [
  [192, 'logo192.png'],
  [512, 'logo512.png'],
];

for (const [size, name] of targets) {
  const file = path.join(outDir, name);
  fs.writeFileSync(file, renderIcon(size));
  console.log(`✓ ${name} (${size}x${size}, ${fs.statSync(file).size} bytes)`);
}
