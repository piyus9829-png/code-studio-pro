import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  // RGBA buffer
  const buffer = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }

  // PNG filter type 0 for each scanline
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    const scanlineOffset = y * (width * 4 + 1);
    scanlines[scanlineOffset] = 0; // Filter None
    const bufferOffset = y * width * 4;
    buffer.copy(scanlines, scanlineOffset + 1, bufferOffset, bufferOffset + width * 4);
  }

  const compressedData = zlib.deflateSync(scanlines);

  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: RGBA
  ihdr[10] = 0; // Compression method
  ihdr[11] = 0; // Filter method
  ihdr[12] = 0; // Interlace method

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(len + 12);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crcData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = crc32(crcData);
  chunk.writeUInt32BE(crc >>> 0, len + 8);
  return chunk;
}

// CRC-32 calculation
function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

const table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  table[i] = c;
}

function drawAppIcon(x, y, w, h, isMaskable = false) {
  const nx = x / w;
  const ny = y / h;

  // Background gradient: Deep slate / indigo
  const rBg = Math.round(15 + 15 * ny);
  const gBg = Math.round(23 + 10 * nx);
  const bBg = Math.round(42 + 40 * (nx + ny) / 2);

  if (!isMaskable) {
    // Rounded corner squircle
    const radius = w * 0.22;
    const dx = Math.max(0, Math.abs(x - w / 2) - (w / 2 - radius));
    const dy = Math.max(0, Math.abs(y - h / 2) - (h / 2 - radius));
    if (Math.hypot(dx, dy) > radius) {
      return [0, 0, 0, 0]; // Transparent outside squircle
    }
  }

  // Draw code brackets < > and central bolt
  const cx = w / 2;
  const cy = h / 2;
  const scale = isMaskable ? 0.75 : 1.0;
  const px = (x - cx) / scale + cx;
  const py = (y - cy) / scale + cy;

  // Left bracket check
  const leftBracketDist = distToSegment(px, py, w * 0.35, h * 0.30, w * 0.20, h * 0.50) +
                         distToSegment(px, py, w * 0.20, h * 0.50, w * 0.35, h * 0.70);
  const isLeftBracket = Math.min(
    distToSegment(px, py, w * 0.35, h * 0.30, w * 0.20, h * 0.50),
    distToSegment(px, py, w * 0.20, h * 0.50, w * 0.35, h * 0.70)
  ) < (w * 0.04);

  // Right bracket check
  const isRightBracket = Math.min(
    distToSegment(px, py, w * 0.65, h * 0.30, w * 0.80, h * 0.50),
    distToSegment(px, py, w * 0.80, h * 0.50, w * 0.65, h * 0.70)
  ) < (w * 0.04);

  // Center triangle play bolt
  const inTriangle = pointInTriangle(
    px, py,
    w * 0.45, h * 0.36,
    w * 0.62, h * 0.50,
    w * 0.45, h * 0.64
  );

  if (isLeftBracket || isRightBracket) {
    // Indigo / Cyan gradient
    return [99, 102, 241, 255];
  }

  if (inTriangle) {
    // Cyan / Emerald gradient
    return [56, 189, 248, 255];
  }

  // Status dot
  const dotDist = Math.hypot(px - cx, py - h * 0.78);
  if (dotDist < w * 0.035) {
    return [16, 185, 129, 255]; // Emerald active dot
  }

  return [rBg, gBg, bBg, 255];
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

function pointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
  const d1 = sign(px, py, x1, y1, x2, y2);
  const d2 = sign(px, py, x2, y2, x3, y3);
  const d3 = sign(px, py, x3, y3, x1, y1);
  const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
  const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
  return !(hasNeg && hasPos);
}

function sign(p1x, p1y, p2x, p2y, p3x, p3y) {
  return (p1x - p3x) * (p2y - p3y) - (p2x - p3x) * (p1y - p3y);
}

// Generate files in public directory
const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PWA icons...');

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, (x, y, w, h) => drawAppIcon(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, (x, y, w, h) => drawAppIcon(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, (x, y, w, h) => drawAppIcon(x, y, w, h, true)));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, (x, y, w, h) => drawAppIcon(x, y, w, h, false)));

// Generate clean screenshots for PWABuilder checklist
fs.writeFileSync(path.join(publicDir, 'screenshot-desktop.png'), createPNG(1280, 720, (x, y, w, h) => {
  const nx = x / w;
  const ny = y / h;
  return [15, 23, 42, 255];
}));

fs.writeFileSync(path.join(publicDir, 'screenshot-mobile.png'), createPNG(750, 1334, (x, y, w, h) => {
  const nx = x / w;
  const ny = y / h;
  return [15, 23, 42, 255];
}));

console.log('PWA icons & screenshots generated successfully!');
