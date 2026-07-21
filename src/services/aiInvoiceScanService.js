const { getAnthropicVisionConfig } = require("../lib/aiVisionConfig");
const { isAiPaused } = require("../lib/aiConfig");

/**
 * Skanim fature BLERJEJE (Blerjet → kontrollo → Regjistro → stok).
 * Pa klasifikues automatik — nuk gjykon shitje/shpenzim; pronari e hap nga Blerjet.
 * Kontabilisti / shpenzimet mbeten modul i ndarë.
 */
const EXTRACT_PROMPT =
  "Kjo është faturë BLERJEJE furnizuesi për stok restoranti/kafeneje. Lexo saktë nga foto.\n" +
  "Emri i kafenesë në faturë (p.sh. Babylon) është BLERËSI — furnizuesi është DISKONT/Metro/etj.\n" +
  "Lexo TË GJITHË rreshtat e PRODUKTEVE nga tabela — asnjë produkt mos e anashkalo.\n" +
  "MOS përfshi si artikull: TVSH, zbritje, transport, total, subtotal, raundim.\n" +
  "Numëro rreshtat e produkteve në foto dhe kthe SAKTËSISHT të njëjtin numër në items.\n" +
  "Për çdo artikull:\n" +
  "- name = emri SAKTËSISHT si në faturë — MOS invento emra\n" +
  "- quantity = kolonën Sasia (sa PAKO / njësi u blenë)\n" +
  "- unit = 'pako' nëse Njësia është Pako/Pakë, përndryshe 'copë'/'kg'/'l'\n" +
  "- unit_price = 'Cmimi me tvsh' (çmimi për 1 pako/njësi), JO 'Vlera me tvsh'\n" +
  "- line_total = 'Vlera me tvsh' e atij rreshti nëse duket, përndryshe quantity*unit_price\n" +
  "- pieces_per_pack = sa COPË brenda 1 pako:\n" +
  "  * emri ka '10 cop' / '24 cop' → ai numër\n" +
  "  * pije 0.25l/0.33l/0.5l në pako (pa numër) → zakonisht 24\n" +
  "  * tashmë copë → 1\n" +
  "supplier, invoice_number, invoice_date (YYYY-MM-DD),\n" +
  "total_with_vat = TOTALI i faturës me TVSH (nëse duket).\n" +
  "Përgjigju VETËM me JSON valid (pa markdown):\n" +
  '{"supplier":"DISKONT DESAR SH.P.K.","invoice_number":"2026-900","invoice_date":"2026-07-15","total_with_vat":66.50,"items":[{"name":"Golden Eagle 0.25l","quantity":7,"unit":"pako","unit_price":9.50,"line_total":66.50,"pieces_per_pack":24}]}';

function parseNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value * 1000) / 1000;
  }
  let cleaned = String(value ?? "")
    .replace(/\s/g, "")
    .replace(/[^\d.,-]/g, "");
  if (cleaned.includes(",") && cleaned.includes(".")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    cleaned = cleaned.replace(",", ".");
  }
  const match = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? Math.round(n * 1000) / 1000 : null;
}

function normalizeUnit(unit) {
  const u = String(unit || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (/^(pako|pake|pak|box|carton|kutia|kuti)$/.test(u)) return "pako";
  if (/^(kg|kilogram|kilograme|kilo|g|gr|gram)$/.test(u)) return "kg";
  if (/^(l|lt|liter|liter|litra|ml)$/.test(u)) return "l";
  return "copë";
}

function piecesFromName(name) {
  const m = String(name || "").match(/(\d+)\s*cop(?:e|ë|a)?\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function inferPiecesPerPack(name, unit, explicit) {
  const e = parseNumber(explicit);
  if (e != null && e > 0) return Math.max(1, Math.round(e));
  const fromName = piecesFromName(name);
  if (fromName) return fromName;
  const u = normalizeUnit(unit);
  if (u === "pako") return 24;
  return 1;
}

function normalizeInvoiceItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];

  const seen = new Set();
  const items = [];

  for (const entry of rawItems) {
    const name = String(entry?.name ?? entry?.emri ?? entry?.product ?? entry?.artikull ?? "").trim();
    if (!name) continue;
    if (/^(tvsh|vat|total|subtotal|zbritje|rabate|transport|shipping|raundim)/i.test(name)) {
      continue;
    }

    const quantity = parseNumber(entry?.quantity ?? entry?.sasia ?? entry?.qty ?? entry?.amount);
    const unit = normalizeUnit(entry?.unit ?? entry?.njesia ?? entry?.njësia ?? "copë");
    const unit_price = parseNumber(
      entry?.unit_price ?? entry?.price ?? entry?.cmimi ?? entry?.cost ?? entry?.unit_cost,
    );
    if (quantity == null || quantity <= 0) continue;

    const pieces_per_pack = inferPiecesPerPack(
      name,
      unit,
      entry?.pieces_per_pack ?? entry?.copa_ne_pako ?? entry?.pieces,
    );
    const line_total = parseNumber(entry?.line_total ?? entry?.vlera ?? entry?.value);

    const key = `${name.toLowerCase()}|${quantity}|${unit}|${pieces_per_pack}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      name,
      quantity,
      unit,
      unit_price: unit_price != null && unit_price >= 0 ? unit_price : 0,
      pieces_per_pack,
      ...(line_total != null && line_total >= 0 ? { line_total } : {}),
    });
  }

  return items;
}

function extractJsonPayload(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) throw new Error("AI nuk ktheu përgjigje.");

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : trimmed).trim();

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new Error("AI nuk ktheu JSON valid për faturën.");
  }
}

function buildTotalsCheck(items, invoiceTotal) {
  const linesSum = items.reduce((sum, it) => {
    if (it.line_total != null && Number.isFinite(it.line_total)) {
      return sum + it.line_total;
    }
    return sum + Number(it.quantity || 0) * Number(it.unit_price || 0);
  }, 0);
  const roundedLines = Math.round(linesSum * 100) / 100;
  const warnings = [];
  let ok = true;
  let invoice_total = null;

  if (invoiceTotal != null && invoiceTotal > 0) {
    invoice_total = Math.round(invoiceTotal * 100) / 100;
    const diff = Math.abs(roundedLines - invoice_total);
    const tolerance = Math.max(0.5, invoice_total * 0.12);
    if (diff > tolerance) {
      ok = false;
      warnings.push(
        `Shuma e rreshtave (${roundedLines.toFixed(2)} €) nuk përputhet mirë me totalin e faturës (${invoice_total.toFixed(2)} €). Kontrollo sasitë/çmimet para se të regjistrosh.`,
      );
    }
  }

  for (const it of items) {
    if (it.line_total == null || it.unit_price == null) continue;
    const expected = Math.round(it.quantity * it.unit_price * 100) / 100;
    const got = Math.round(it.line_total * 100) / 100;
    if (Math.abs(expected - got) > Math.max(0.3, expected * 0.15)) {
      warnings.push(
        `Rreshti «${it.name}»: sasia×çmimi (${expected.toFixed(2)}) ≠ vlera rreshtit (${got.toFixed(2)}).`,
      );
    }
  }

  return {
    ok,
    lines_sum: roundedLines,
    invoice_total,
    warnings,
  };
}

async function callAnthropicVision({ mime, base64, prompt, maxTokens }) {
  const config = getAnthropicVisionConfig();
  if (!config.ready) {
    throw new Error("Skanimi i faturës kërkon ANTHROPIC_API_KEY në environment.");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: maxTokens || config.maxTokens,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mime,
                data: base64,
              },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error?.message || `Anthropic Vision gabim (${res.status})`);
  }

  const text = (data.content || [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();

  const tokensUsed =
    Number(data.usage?.input_tokens || 0) + Number(data.usage?.output_tokens || 0);

  return { text, tokensUsed, model: config.model };
}

/**
 * Lexon faturën e furnizuesit. Nuk klasifikon / nuk bllokon.
 * Ruajtja në stok bëhet vetëm pasi pronari shtyp «Regjistro» te Blerjet.
 */
async function scanInvoiceFromImage({ mime, base64 }) {
  if (isAiPaused()) {
    throw new Error("AI është i ndalur për momentin. Provoni përsëri më vonë.");
  }
  if (!mime || !base64) {
    throw new Error("Mungon fotoja e faturës.");
  }

  const config = getAnthropicVisionConfig();
  const { text, tokensUsed, model } = await callAnthropicVision({
    mime,
    base64,
    prompt: EXTRACT_PROMPT,
    maxTokens: config.maxTokens,
  });

  const payload = extractJsonPayload(text);
  const items = normalizeInvoiceItems(payload.items ?? payload.lines ?? payload.artikuj ?? payload);

  if (!items.length) {
    throw new Error("Nuk u gjetën artikuj në foto. Provoni një foto më të qartë të faturës së furnizuesit.");
  }

  const invoiceTotal = parseNumber(
    payload.total_with_vat ?? payload.total ?? payload.grand_total ?? payload.totali,
  );
  const totals_check = buildTotalsCheck(items, invoiceTotal);

  return {
    document_type: "stock_purchase",
    supplier: String(payload.supplier ?? payload.furnizues ?? payload.vendor ?? "").trim(),
    invoice_number: String(
      payload.invoice_number ?? payload.invoice_no ?? payload.nr_fature ?? payload.number ?? "",
    ).trim(),
    invoice_date: String(payload.invoice_date ?? payload.date ?? payload.data ?? "")
      .trim()
      .slice(0, 10),
    items,
    totals_check,
    warnings: totals_check.warnings || [],
    tokensUsed,
    model,
    provider: "anthropic",
  };
}

module.exports = {
  scanInvoiceFromImage,
  normalizeInvoiceItems,
  buildTotalsCheck,
};
