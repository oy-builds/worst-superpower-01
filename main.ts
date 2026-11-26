import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const srcPath = join(here, "entry.txt");
const srcBytes = readFileSync(srcPath);

// The source file must be valid UTF-8 and hold exactly one line plus a
// single trailing newline.
const raw = new TextDecoder("utf-8", { fatal: true }).decode(srcBytes);
if (!raw.endsWith("\n") || raw.endsWith("\n\n")) {
  throw new Error("entry.txt must end with exactly one trailing newline");
}
const entry = raw.slice(0, -1);
const charCount = [...entry].length;

if (charCount === 0) throw new Error("entry is empty");
if (entry.trim().length === 0) throw new Error("entry is only whitespace");
if (charCount < 1 || charCount > 140) {
  throw new Error(`entry must be 1-140 characters, got ${charCount}`);
}
if (entry.includes("\n") || entry.includes("\r")) {
  throw new Error("entry must be a single line");
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "entry.txt");
writeFileSync(outPath, entry + "\n", "utf8");

// Byte-exact round-trip: what landed on disk must equal the source bytes.
const written = readFileSync(outPath);
if (!written.equals(srcBytes)) {
  throw new Error("round-trip mismatch: output bytes differ from entry.txt");
}
const check = new TextDecoder("utf-8", { fatal: true }).decode(written);
if (check !== raw || [...check.slice(0, -1)].length !== charCount) {
  throw new Error("round-trip mismatch: output text differs from entry.txt");
}
console.log(`wrote ${outPath} (${charCount} chars, ${written.length} bytes, round-trip OK)`);
