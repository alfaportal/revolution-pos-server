/**
 * Faturë e thjeshtë PDF (pa varësi të jashtme) për faturimin e tokenëve AI.
 */

function pdfEscape(text) {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function buildAiUsageInvoicePdf({
  clientName,
  month,
  tokensTotal,
  costEur,
  calls,
  packageTier,
  invoiceNo,
  breakdown = {},
}) {
  const lines = [
    "Revolution Invest POS — Fature AI",
    `Nr: ${invoiceNo || `AI-${month}`}`,
    `Muaji: ${month}`,
    `Klienti: ${clientName || "—"}`,
    `Pakoja: ${packageTier || "—"}`,
    "",
    `Thirrje AI: ${Number(calls || 0)}`,
    `Tokena: ${Number(tokensTotal || 0).toLocaleString("en-US")}`,
    `Kosto: ${Number(costEur || 0).toFixed(4)} EUR`,
    "",
    "Detaje:",
  ];

  for (const [feature, row] of Object.entries(breakdown || {})) {
    if (!row || !row.calls) continue;
    lines.push(
      `  ${feature}: ${row.calls} thirrje, ${row.tokens || 0} token, ${(row.cost_eur || 0).toFixed(4)} EUR`,
    );
  }

  lines.push("");
  lines.push("Faleminderit — Revolution Invest");
  lines.push(new Date().toISOString().slice(0, 10));

  const contentLines = lines.map((line, i) => {
    const y = 800 - i * 16;
    return `BT /F1 11 Tf 50 ${y} Td (${pdfEscape(line)}) Tj ET`;
  });

  const stream = contentLines.join("\n");
  const objects = [];
  objects.push("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n");
  objects.push("2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n");
  objects.push(
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n",
  );
  objects.push(
    `4 0 obj<< /Length ${Buffer.byteLength(stream, "utf8")} >>stream\n${stream}\nendstream\nendobj\n`,
  );
  objects.push("5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n");

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  }
  const xrefPos = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;
  return Buffer.from(pdf, "utf8");
}

module.exports = { buildAiUsageInvoicePdf };
