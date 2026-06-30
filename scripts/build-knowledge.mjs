// Gom toàn bộ knowledge/**/*.md thành 1 module để Cloudflare Function nạp vào prompt.
// Chạy: npm run build  (tự chạy trước khi dev/deploy)
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const KNOWLEDGE_DIR = join(root, "knowledge");
const OUT = join(root, "functions", "_shared", "knowledge.js");

async function walk(dir) {
  let out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out = out.concat(await walk(p));
    // Bỏ qua file bắt đầu bằng "_" (ghi chú nội bộ, không đưa vào prompt)
    else if (e.name.endsWith(".md") && !e.name.startsWith("_")) out.push(p);
  }
  return out;
}

const files = (await walk(KNOWLEDGE_DIR)).sort();
const parts = [];
for (const f of files) {
  const rel = f.slice(KNOWLEDGE_DIR.length + 1);
  const content = (await readFile(f, "utf8")).trim();
  if (content) parts.push(`### FILE: ${rel}\n\n${content}`);
}
const combined = parts.join("\n\n---\n\n");

await mkdir(dirname(OUT), { recursive: true });
await writeFile(
  OUT,
  `// AUTO-GENERATED bởi scripts/build-knowledge.mjs — ĐỪNG SỬA TAY.\n` +
    `export const KNOWLEDGE = ${JSON.stringify(combined)};\n`
);

console.log(
  `✓ Gom ${files.length} file → functions/_shared/knowledge.js (${combined.length.toLocaleString()} ký tự)`
);
if (!files.length) console.warn("⚠ Không tìm thấy file .md nào trong knowledge/");
