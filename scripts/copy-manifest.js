import fs from "fs";
import path from "path";

const manifestPath = path.resolve("manifest.json");
const distManifestPath = path.resolve("dist/manifest.json");

// Copy manifest.json to dist after build
fs.copyFileSync(manifestPath, distManifestPath);
console.log("✅ Manifest copied to dist folder.");
