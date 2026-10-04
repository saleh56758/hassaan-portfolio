import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";

import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const errors = [];

function findHtmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === ".git" || entry.name === "node_modules") return [];
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return findHtmlFiles(path);
    return extname(entry.name).toLowerCase() === ".html" ? [path] : [];
  });
}

const htmlFiles = findHtmlFiles(root);
const documents = new Map(htmlFiles.map((file) => [file, readFileSync(file, "utf8")]));

function resolveLocalTarget(page, target) {
  const decodedTarget = decodeURIComponent(target);
  const path = decodedTarget.startsWith("/")
    ? resolve(root, decodedTarget.slice(1))
    : resolve(dirname(page), decodedTarget);
  if (extname(path)) return path;
  if (existsSync(join(path, "index.html"))) return join(path, "index.html");
  if (existsSync(`${path}.html`)) return `${path}.html`;
  return path;
}

for (const [page, html] of documents) {
  const pageName = relative(root, page).replaceAll("\\", "/");
  const activeHtml = html.replace(/<!--[\s\S]*?-->/g, "");
  const ids = new Set([...activeHtml.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]));

  for (const match of activeHtml.matchAll(/(?:src|href)=["']([^"']*)["']/g)) {
    const value = match[1];
    if (/^(https?:|mailto:|tel:|javascript:|data:)/i.test(value)) continue;

    const [target, fragment] = value.split("#", 2);
    if (!target) {
      if (fragment && !ids.has(fragment)) errors.push(`${pageName}: missing anchor #${fragment}`);
      continue;
    }

    const localTarget = resolveLocalTarget(page, target.split("?", 1)[0]);
    if (!existsSync(localTarget)) {
      errors.push(`${pageName}: missing local target ${value}`);
      continue;
    }

    if (fragment && extname(localTarget).toLowerCase() === ".html") {
      const targetHtml = documents.get(localTarget) || readFileSync(localTarget, "utf8");
      const targetIds = new Set([...targetHtml.matchAll(/\bid=["']([^"']+)["']/g)].map((item) => item[1]));
      if (!targetIds.has(fragment)) errors.push(`${pageName}: missing anchor ${value}`);
    }
  }

  if (/<script(?![^>]*\bsrc=)/i.test(activeHtml)) {
    errors.push(`${pageName}: inline scripts are not allowed by the Content Security Policy.`);
  }
}

for (const required of ["index.html", "css/styles.css", "js/main.js", "js/theme-init.js", "resume/Hassaan-Saleh-Resume.pdf"]) {
  if (!existsSync(join(root, required))) errors.push(`Missing required file: ${required}`);
}

if (errors.length) {
  console.error(errors.map((error) => `✗ ${error}`).join("\n"));
  process.exit(1);
}

console.log(`✓ Portfolio validation passed (${htmlFiles.length} HTML page${htmlFiles.length === 1 ? "" : "s"})`);
