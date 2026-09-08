import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const html = readFileSync(join(root, "index.html"), "utf8");
const errors = [];

for (const match of html.matchAll(/(?:src|href)=["']([^"'#?]+)["']/g)) {
  const asset = match[1];
  if (/^(https?:|mailto:|tel:|javascript:|data:|#|\/)/i.test(asset)) continue;
  const file = resolve(root, asset.replaceAll("/", "\\"));
  if (!existsSync(file)) errors.push(`Missing local asset: ${asset}`);
}

const ids = new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map((m) => m[1]));
for (const target of html.matchAll(/href=["']#([^"']+)["']/g)) {
  if (!ids.has(target[1])) errors.push(`Missing anchor target: #${target[1]}`);
}

for (const required of ["index.html", "css/styles.css", "js/main.js", "resume/Hassaan-Saleh-Resume.pdf"]) {
  if (!existsSync(join(root, required))) errors.push(`Missing required file: ${required}`);
}

if (errors.length) {
  console.error(errors.map((error) => `✗ ${error}`).join("\n"));
  process.exit(1);
}

console.log(`✓ Portfolio validation passed (${relative(root, join(root, "index.html"))})`);
