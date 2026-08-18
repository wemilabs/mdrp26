import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const publicDir = resolve(root, "public");
const iconsDir = resolve(publicDir, "icons");
const logoPath = resolve(publicDir, "prism-logo.svg");

const PRISM_DARK = "#0f3a3c";

// A maskable icon must keep its key content inside the central ~80% safe zone.
// We composite the SVG logo onto a solid background and scale it down so the
// prism triangle + beams remain visible after the OS applies any mask shape.
async function renderMaskable(size) {
  const bg = sharp({
    create: { width: size, height: size, channels: 4, background: PRISM_DARK },
  });
  const logoBuffer = await readFile(logoPath);
  const scaled = await sharp(logoBuffer)
    .resize(Math.round(size * 0.7))
    .png()
    .toBuffer();
  return bg
    .composite([{ input: scaled, gravity: "center" }])
    .png()
    .toBuffer();
}

async function main() {
  await mkdir(iconsDir, { recursive: true });
  const logoBuffer = await readFile(logoPath);

  const targets = [
    { name: "icon-192.png", size: 192, maskable: false },
    { name: "icon-512.png", size: 512, maskable: false },
    { name: "apple-touch-icon-180.png", size: 180, maskable: false },
    { name: "maskable-512.png", size: 512, maskable: true },
  ];

  for (const { name, size, maskable } of targets) {
    const out = resolve(iconsDir, name);
    if (maskable) {
      const buf = await renderMaskable(size);
      await writeFile(out, buf);
    } else {
      await sharp(logoBuffer).resize(size, size).png().toFile(out);
    }
    console.log(`wrote ${name} (${size}x${size}${maskable ? ", maskable" : ""})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
