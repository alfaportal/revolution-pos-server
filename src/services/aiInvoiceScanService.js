const { getAnthropicVisionConfig } = require("../lib/aiVisionConfig");
const { isAiPaused } = require("../lib/aiConfig");

const SCAN_PROMPT =
  "Analizo këtë foto të faturës së furnizuesit (faturë shitje/blerje, shqip ose anglisht). " +
  "Lexo TË GJITHË rreshtat e produkteve nga tabela — asnjë rresht mos e anashkalo (edhe nëse është i fundit ose i vogël). " +
  "Numëro rreshtat e produkteve në foto dhe kthe SAKTËSISHT të njëjtin numër në items. " +
  "Për çdo artikull: name = emri i produktit (p.sh. Golden Eagle, Fanta, Uji Mineral); " +
  "quantity = numri në kolonën Sasia (p.sh. 7 pako = 7, jo totali i pagesës); " +
  "unit = pako/copë/kg/l sipas faturës (nëse është Pako përdor 'copë'); " +
  "unit_price = çmimi PËR NJËSI me TVSH (Cmimi me tvsh), JO 'Vlera me tvsh' e rreshtit. " +
  "supplier = emri i firmës/furnizuesit; invoice_number = numri i faturës; " +
  "invoice_date = data e faturës në format YYYY-MM-DD (nëse duket). " +
  "Përgjigju VETËM me JSON valid (pa markdown, pa shpjegim) në këtë format:\n" +
  '{"supplier":"Emri i furnizuesit","invoice_number":"2026-900","invoice_date":"2026-07-15","items":[{"name":"Golden Eagle 0.25l","quantity":7,"unit":"copë","unit_price":9.50}]}';

function parseNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value * 1000) / 1000;
  }
  let cleaned = String(value ?? "")
    .replace(/\s/g, "")
    .replace(/[^\d.,-]/g, "");
  // Evropiane: 1.234,56 → 1234.56 | 7,00 → 7.00
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
  if (/^(kg|kilogram|kilogramë|kilo|g|gr|gram)$/.test(u)) return "kg";
  if (/^(l|lt|liter|litër|litra|ml)$/.test(u)) return "l";
  return "copë";
}

function normalizeInvoiceItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];

  const seen = new Set();
  const items = [];

  for (const entry of rawItems) {
    const name = String(entry?.name ?? entry?.emri ?? entry?.product ?? entry?.artikull ?? "").trim();
    const quantity = parseNumber(entry?.quantity ?? entry?.sasia ?? entry?.qty ?? entry?.amount);
    const unit = normalizeUnit(entry?.unit ?? entry?.njesia ?? entry?.njësia ?? "copë");
    const unit_price = parseNumber(
      entry?.unit_price ?? entry?.price ?? entry?.cmimi ?? entry?.cost ?? entry?.unit_cost,
    );
    if (!name || quantity == null || quantity <= 0) continue;

    const key = `${name.toLowerCase()}|${quantity}|${unit}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      name,
      quantity,
      unit,
      unit_price: unit_price != null && unit_price >= 0 ? unit_price : 0,
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

async function scanInvoiceFromImage({ mime, base64 }) {
  if (isAiPaused()) {
    throw new Error("AI është i ndalur për momentin. Provoni përsëri më vonë.");
  }
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
      max_tokens: config.maxTokens,
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
            {
              type: "text",
              text: SCAN_PROMPT,
            },
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
    .filter(block => block.type === "text")
    .map(block => block.text)
    .join("")
    .trim();

  const payload = extractJsonPayload(text);
  const items = normalizeInvoiceItems(payload.items ?? payload.lines ?? payload.artikuj ?? payload);

  if (!items.length) {
    throw new Error("Nuk u gjetën artikuj në foto. Provoni një foto më të qartë të faturës.");
  }

  const tokensUsed =
    Number(data.usage?.input_tokens || 0) + Number(data.usage?.output_tokens || 0);

  return {
    supplier: String(payload.supplier ?? payload.furnizues ?? payload.vendor ?? "").trim(),
    invoice_number: String(
      payload.invoice_number ?? payload.invoice_no ?? payload.nr_fature ?? payload.number ?? "",
    ).trim(),
    invoice_date: String(payload.invoice_date ?? payload.date ?? payload.data ?? "").trim().slice(0, 10),
    items,
    tokensUsed,
    model: config.model,
    provider: "anthropic",
  };
}

module.exports = { scanInvoiceFromImage };
