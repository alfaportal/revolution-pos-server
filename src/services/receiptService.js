const { getSupabase } = require("../db");
const { buildEscPosFromLines, toBase64 } = require("../lib/receiptEscPos");

function getClientById(clientId) {
  const { getClientById: loadClient } = require("./salesService");
  return loadClient(clientId);
}

function paperChars(widthMm) {
  return Number(widthMm) <= 58 ? 32 : 48;
}

function pad(str, width, align = "left") {
  const s = String(str ?? "");
  if (s.length >= width) return s.slice(0, width);
  const gap = width - s.length;
  if (align === "right") return " ".repeat(gap) + s;
  if (align === "center") {
    const left = Math.floor(gap / 2);
    return " ".repeat(left) + s + " ".repeat(gap - left);
  }
  return s + " ".repeat(gap);
}

function divider(width, char = "-") {
  return char.repeat(width);
}

function formatMoney(n) {
  return Number(n || 0).toFixed(2);
}

function formatReceiptDateTime(iso) {
  const d = iso ? new Date(iso) : new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return { date: `${dd}/${mm}/${yyyy}`, time: `${hh}:${min}` };
}

async function getBusinessProfile(clientId) {
  const client = await getClientById(clientId);
  const db = getSupabase();
  const { data: settings } = await db
    .from("pos_settings")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();

  const widthMm = [58, 80].includes(Number(settings?.receipt_width_mm))
    ? Number(settings.receipt_width_mm)
    : 80;

  return {
    business_name: String(settings?.restaurant_name || client?.emri || "").trim(),
    address: String(settings?.address || client?.adresa || "").trim(),
    phone: String(settings?.phone || client?.telefoni || "").trim(),
    nui: String(settings?.nui || "").trim(),
    tvsh_nr: String(settings?.tvsh_nr || "").trim(),
    receipt_width_mm: widthMm,
  };
}

function normalizeReceiptItems(items) {
  return (Array.isArray(items) ? items : []).map(i => ({
    name: String(i.name || i.emri || "").trim(),
    quantity: Number(i.quantity) || 1,
    price: Number(i.price ?? i.cmimi ?? 0) || 0,
  })).filter(i => i.name);
}

function buildReceiptPayload(clientId, business, body) {
  const items = normalizeReceiptItems(body.items);
  const total = Number(body.total) || items.reduce((s, i) => s + i.price * i.quantity, 0);
  const closedAt = body.closed_at || body.printed_at || new Date().toISOString();
  const { date, time } = formatReceiptDateTime(closedAt);
  const printed = formatReceiptDateTime(body.printed_at || new Date().toISOString());

  return {
    business,
    receipt_number: String(body.receipt_number || body.order_number || "").trim(),
    order_number: String(body.order_number || body.local_order_id || body.receipt_number || "").trim(),
    table_number: Number(body.table_number) || 0,
    waiter_name: String(body.waiter_name || "").trim(),
    cashier_name: String(body.cashier_name || body.operator_name || "").trim(),
    register_name: String(body.register_name || body.arka || "").trim(),
    items,
    total,
    closed_at: closedAt,
    date,
    time,
    printed_date: printed.date,
    printed_time: printed.time,
    paper_width_mm: business.receipt_width_mm,
  };
}

function formatItemRows(items, width) {
  const rows = [];
  if (width >= 48) {
    rows.push(
      pad("Emërtimi", 22)
        + pad("Sasia", 6, "right")
        + pad("Çmimi", 8, "right")
        + pad("Vlera", 8, "right"),
    );
    for (const item of items) {
      const qty = String(item.quantity);
      const unit = formatMoney(item.price);
      const lineTotal = formatMoney(item.price * item.quantity);
      rows.push(
        pad(item.name, 22)
          + pad(qty, 6, "right")
          + pad(`x${unit}`, 8, "right")
          + pad(`=${lineTotal}`, 8, "right"),
      );
    }
    return rows;
  }

  rows.push(
    pad("Emërtimi", 16)
      + pad("S", 3, "right")
      + pad("Vlera", 9, "right"),
  );
  for (const item of items) {
    const name = item.name.length > 16 ? `${item.name.slice(0, 15)}…` : item.name;
    const lineTotal = formatMoney(item.price * item.quantity);
    rows.push(
      pad(name, 16)
        + pad(String(item.quantity), 3, "right")
        + pad(lineTotal, 9, "right"),
    );
    rows.push(pad(`  x ${formatMoney(item.price)}`, width));
  }
  return rows;
}

function buildReceiptLines(receipt) {
  const w = paperChars(receipt.paper_width_mm);
  const lines = [];
  const biz = receipt.business;

  if (biz.business_name) lines.push(biz.business_name);
  if (biz.address) lines.push(biz.address);
  if (biz.phone) lines.push(`Tel: ${biz.phone}`);
  if (biz.nui) lines.push(`NUI: ${biz.nui}`);
  if (biz.tvsh_nr) lines.push(`TVSH Nr.: ${biz.tvsh_nr}`);

  lines.push(divider(w));
  if (receipt.receipt_number) lines.push(`Nr. Porosia: ${receipt.receipt_number}`);
  if (receipt.table_number) lines.push(`Tavolina: T${receipt.table_number}`);
  if (receipt.waiter_name) lines.push(`Kamarieri: ${receipt.waiter_name}`);
  if (receipt.register_name) lines.push(`Arka: ${receipt.register_name}`);
  if (receipt.cashier_name) lines.push(`Operatori: ${receipt.cashier_name}`);
  lines.push(`Data: ${receipt.date}  Ora: ${receipt.time}`);
  lines.push(divider(w));

  lines.push(...formatItemRows(receipt.items, w));
  lines.push(divider(w));

  const totalLabel = "GJITHSEJ:";
  const totalVal = `${formatMoney(receipt.total)}€`;
  if (w >= 48) {
    lines.push(pad(totalLabel, w - totalVal.length, "left") + totalVal);
  } else {
    lines.push(totalLabel);
    lines.push(pad(totalVal, w, "right"));
  }

  lines.push(divider(w));
  lines.push("FALEMINDERIT!");
  if (biz.business_name) lines.push(biz.business_name);
  lines.push(`${receipt.printed_date} ${receipt.printed_time}`);

  return lines;
}

function buildMarkedReceiptLines(receipt) {
  const w = paperChars(receipt.paper_width_mm);
  const lines = [];
  const biz = receipt.business;

  if (biz.business_name) lines.push(`^C^B${biz.business_name}`);
  if (biz.address) lines.push(`^C${biz.address}`);
  if (biz.phone) lines.push(`^CTel: ${biz.phone}`);
  if (biz.nui) lines.push(`^CNUI: ${biz.nui}`);
  if (biz.tvsh_nr) lines.push(`^CTVSH Nr.: ${biz.tvsh_nr}`);

  lines.push(divider(w));
  if (receipt.receipt_number) lines.push(`Nr. Porosia: ${receipt.receipt_number}`);
  if (receipt.table_number) lines.push(`Tavolina: T${receipt.table_number}`);
  if (receipt.waiter_name) lines.push(`Kamarieri: ${receipt.waiter_name}`);
  if (receipt.register_name) lines.push(`Arka: ${receipt.register_name}`);
  if (receipt.cashier_name) lines.push(`Operatori: ${receipt.cashier_name}`);
  lines.push(`Data: ${receipt.date}  Ora: ${receipt.time}`);
  lines.push(divider(w));

  lines.push(...formatItemRows(receipt.items, w));
  lines.push(divider(w));

  const totalLabel = "GJITHSEJ:";
  const totalVal = `${formatMoney(receipt.total)}€`;
  if (w >= 48) {
    lines.push(`^R^L^B${totalLabel}${" ".repeat(Math.max(1, w - totalLabel.length - totalVal.length))}${totalVal}`);
  } else {
    lines.push(`^R^L^B${totalLabel}`);
    lines.push(`^R^L^B${totalVal}`);
  }

  lines.push(divider(w));
  lines.push("^CFALEMINDERIT!");
  if (biz.business_name) lines.push(`^C${biz.business_name}`);
  lines.push(`^C${receipt.printed_date} ${receipt.printed_time}`);

  return lines;
}

function formatReceiptText(receipt) {
  return buildReceiptLines(receipt).join("\n");
}

function formatReceiptEscPosBase64(receipt) {
  const buffer = buildEscPosFromLines(buildMarkedReceiptLines(receipt));
  return toBase64(buffer);
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function formatReceiptHtml(receipt) {
  const w = receipt.paper_width_mm;
  const biz = receipt.business;
  const itemRows = receipt.items.map(i => {
    const unit = formatMoney(i.price);
    const lineTotal = formatMoney(i.price * i.quantity);
    return `<tr>
      <td class="rc-name">${escapeHtml(i.name)}</td>
      <td class="rc-qty">${i.quantity}</td>
      <td class="rc-price">x ${unit}</td>
      <td class="rc-value">= ${lineTotal}</td>
    </tr>`;
  }).join("");

  const headerMeta = [
    biz.address ? `<div>${escapeHtml(biz.address)}</div>` : "",
    biz.phone ? `<div>Tel: ${escapeHtml(biz.phone)}</div>` : "",
    biz.nui ? `<div>NUI: ${escapeHtml(biz.nui)}</div>` : "",
    biz.tvsh_nr ? `<div>TVSH Nr.: ${escapeHtml(biz.tvsh_nr)}</div>` : "",
  ].filter(Boolean).join("");

  const orderMeta = [
    receipt.receipt_number ? `<div>Nr. Porosia: <strong>${escapeHtml(receipt.receipt_number)}</strong></div>` : "",
    receipt.table_number ? `<div>Tavolina: T${receipt.table_number}</div>` : "",
    receipt.waiter_name ? `<div>Kamarieri: ${escapeHtml(receipt.waiter_name)}</div>` : "",
    receipt.register_name ? `<div>Arka: ${escapeHtml(receipt.register_name)}</div>` : "",
    receipt.cashier_name ? `<div>Operatori: ${escapeHtml(receipt.cashier_name)}</div>` : "",
    `<div>Data: ${receipt.date} &nbsp; Ora: ${receipt.time}</div>`,
  ].filter(Boolean).join("");

  return `<div class="receipt-thermal" data-width-mm="${w}">
    <div class="rc-header">
      <div class="rc-business-name">${escapeHtml(biz.business_name || "Faturë")}</div>
      ${headerMeta}
    </div>
    <div class="rc-divider"></div>
    <div class="rc-order-meta">${orderMeta}</div>
    <div class="rc-divider"></div>
    <table class="rc-items">
      <thead>
        <tr>
          <th>Emërtimi</th>
          <th>Sasia</th>
          <th>Çmimi</th>
          <th>Vlera</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    <div class="rc-divider"></div>
    <div class="rc-total">
      <span>GJITHSEJ:</span>
      <span>${formatMoney(receipt.total)}€</span>
    </div>
    <div class="rc-divider"></div>
    <div class="rc-footer">
      <div class="rc-thanks">FALEMINDERIT!</div>
      ${biz.business_name ? `<div>${escapeHtml(biz.business_name)}</div>` : ""}
      <div class="rc-printed">${receipt.printed_date} ${receipt.printed_time}</div>
    </div>
  </div>`;
}

async function formatReceiptBundle(clientId, body) {
  const business = await getBusinessProfile(clientId);
  const receipt = buildReceiptPayload(clientId, business, body);
  return {
    receipt,
    text: formatReceiptText(receipt),
    escpos_base64: formatReceiptEscPosBase64(receipt),
    html: formatReceiptHtml(receipt),
    paper_width_mm: business.receipt_width_mm,
  };
}

async function seedPosSettingsForClient(client) {
  if (!client?.id) return;
  const db = getSupabase();
  const now = new Date().toISOString();
  await db.from("pos_settings").upsert({
    client_id: client.id,
    restaurant_name: client.emri || "",
    address: client.adresa || "",
    phone: client.telefoni || "",
    table_count: 10,
    receipt_width_mm: 80,
    fiscal_enabled: true,
    synced_at: now,
  });
}

async function syncPosSettingsFromClient(clientId) {
  const client = await getClientById(clientId);
  if (!client) return;
  const db = getSupabase();
  const { data: existing } = await db
    .from("pos_settings")
    .select("client_id, restaurant_name, address, phone")
    .eq("client_id", clientId)
    .maybeSingle();

  const patch = {};
  if (!existing?.restaurant_name?.trim()) patch.restaurant_name = client.emri || "";
  if (!existing?.address?.trim() && client.adresa) patch.address = client.adresa;
  if (!existing?.phone?.trim() && client.telefoni) patch.phone = client.telefoni;
  if (!Object.keys(patch).length) return;

  await db.from("pos_settings").upsert({
    client_id: clientId,
    restaurant_name: patch.restaurant_name ?? existing?.restaurant_name ?? client.emri ?? "",
    address: patch.address ?? existing?.address ?? "",
    phone: patch.phone ?? existing?.phone ?? "",
    table_count: 10,
    receipt_width_mm: 80,
    synced_at: new Date().toISOString(),
  });
}

module.exports = {
  paperChars,
  getBusinessProfile,
  buildReceiptPayload,
  formatReceiptText,
  formatReceiptEscPosBase64,
  formatReceiptHtml,
  formatReceiptBundle,
  seedPosSettingsForClient,
  syncPosSettingsFromClient,
};
