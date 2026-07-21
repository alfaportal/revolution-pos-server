"use strict";

const fs = require("fs");
const path = require("path");

function fallbackReplace(part) {
  return part
    .replace(/Ã«/g, "ë")
    .replace(/Ã§/g, "ç")
    .replace(/Ã‹/g, "Ë")
    .replace(/Ã‡/g, "Ç")
    .replace(/Ã©/g, "é")
    .replace(/Ã¨/g, "è")
    .replace(/Ã¡/g, "á")
    .replace(/Ã—/g, "×")
    .replace(/â€”/g, "—")
    .replace(/â€“/g, "–")
    .replace(/â€‘/g, "\u2011")
    .replace(/â€™/g, "\u2019")
    .replace(/â€œ/g, "\u201c")
    .replace(/â€/g, "\u201d")
    .replace(/â€˜/g, "\u2018")
    .replace(/Â«/g, "«")
    .replace(/Â»/g, "»")
    .replace(/Â·/g, "·")
    .replace(/Â©/g, "©")
    .replace(/â˜°/g, "☰")
    .replace(/â†’/g, "→")
    .replace(/â†/g, "←")
    .replace(/â€¦/g, "…");
}

function fixTextChunk(part) {
  if (!part || !/Ã.|â€|Â[«»·©]|â˜|â†/.test(part)) return part;
  try {
    const fixed = Buffer.from(part, "latin1").toString("utf8");
    if (fixed.includes("\uFFFD")) return fallbackReplace(part);
    return fixed;
  } catch {
    return fallbackReplace(part);
  }
}

function fixMojibake(str) {
  // Fix text nodes between tags
  let out = str.split(/(<[^>]+>)/).map((part) => {
    if (!part || part.startsWith("<")) {
      // Also fix attribute values inside tags
      if (part.startsWith("<") && /Ã.|â€|Â[«»·©]/.test(part)) {
        return part.replace(
          /=(["'])([\s\S]*?)\1/g,
          (m, q, val) => `=${q}${fixTextChunk(val)}${q}`,
        );
      }
      // HTML comments
      if (part.startsWith("<!--")) return fixTextChunk(part);
      return part;
    }
    return fixTextChunk(part);
  }).join("");

  // Final sweep for anything left (attrs/comments edge cases)
  out = fallbackReplace(out);
  return out;
}

const root = path.join(__dirname, "..");
const files = [
  "public/website/manual.html",
  "public/website/manual-en-sections.js",
];

for (const rel of files) {
  const p = path.join(root, rel);
  let s = fs.readFileSync(p, "utf8");
  const before = (s.match(/Ã.|â€/g) || []).length;
  s = fixMojibake(s);
  const after = (s.match(/Ã.|â€/g) || []).length;
  fs.writeFileSync(p, s, "utf8");
  console.log(`${rel}: markers ${before} -> ${after}`);
  if (after > 0) {
    const re = /Ã.|â€./g;
    let m;
    let n = 0;
    while ((m = re.exec(s)) && n < 5) {
      console.log("  leftover:", JSON.stringify(s.slice(Math.max(0, m.index - 10), m.index + 18)));
      n++;
    }
  }
}
