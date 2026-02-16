const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const projectRoot = path.join(__dirname, "..");
const svgPath = path.join(projectRoot, "app-icon.svg");
const outDir = path.join(projectRoot, "assets");
const outPath = path.join(outDir, "icon.png");

const SIZE = 1024;

if (!fs.existsSync(svgPath)) {
  console.error("app-icon.svg not found at project root");
  process.exit(1);
}

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

sharp(svgPath)
  .resize(SIZE, SIZE)
  .png({ compressionLevel: 9 })
  .toFile(outPath)
  .then((info) => {
    console.log(`Generated ${outPath} (${info.width}x${info.height})`);
  })
  .catch((err) => {
    console.error("Error generating icon:", err);
    process.exit(1);
  });
