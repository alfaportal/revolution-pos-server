let token = localStorage.getItem("owner_token") || "";

const PWA_BANNER_KEY = "ri_pos_pwa_banner_dismissed";

function isStandalonePwa() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function isIosDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function initPwaInstallBanner() {
  const banner = document.getElementById("pwa-install-banner");
  const hint = document.getElementById("pwa-install-hint");
  const closeBtn = document.getElementById("pwa-install-close");
  if (!banner || !hint || !closeBtn) return;

  if (isStandalonePwa() || localStorage.getItem(PWA_BANNER_KEY) === "1") return;

  hint.textContent = isIosDevice()
    ? "Kliko Share (□↑) → Add to Home Screen"
    : "Kliko menunë (3 pika) → Add to Home Screen";

  banner.classList.remove("hidden");

  closeBtn.addEventListener("click", () => {
    localStorage.setItem(PWA_BANNER_KEY, "1");
    banner.classList.add("hidden");
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/owner/sw.js", { scope: "/owner/" }).catch(() => {});
}

async function api(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, { ...opts, headers, credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.gabim || `HTTP ${res.status}`);
  return data;
}

function euro(n) {
  return Number(n || 0).toFixed(2) + " €";
}

function fmtTime(iso) {
  return new Date(iso).toLocaleString("sq-AL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderItemsTable(items) {
  const arr = Array.isArray(items) ? items : [];
  if (!arr.length) return '<p class="order-items-empty">—</p>';
  const rows = arr.map(it => {
    const qty = Number(it.quantity ?? it.sasia ?? 1) || 1;
    const price = Number(it.price ?? it.cmimi ?? 0) || 0;
    const name = it.name || it.emri || "—";
    return `<tr>
      <td>${name}</td>
      <td class="num">${qty}</td>
      <td class="num">${euro(price)}</td>
      <td class="num">${euro(price * qty)}</td>
    </tr>`;
  }).join("");
  return `<table class="order-items-table">
    <thead><tr><th>Produkti</th><th>Sasia</th><th>Çmimi</th><th>Nëntotali</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function renderLiveTableCard(t) {
  if (t.status === "free") {
    return `<div class="live-table-card free">
      <div class="live-table-title">${t.label}</div>
      <div class="live-table-status">E lirë</div>
    </div>`;
  }
  const o = t.order || {};
  const items = Array.isArray(o.items) ? o.items : [];
  const itemsHtml = items.length
    ? `<ul class="live-table-items">${items.map(it => {
        const qty = Number(it.quantity) || 1;
        const price = Number(it.price) || 0;
        return `<li><span>${qty}× ${it.name}</span><span>${euro(price)}</span></li>`;
      }).join("")}</ul>`
    : "";
  return `<div class="live-table-card occupied">
    <div class="live-table-title">${t.label}</div>
    <div class="live-table-status">E zënë</div>
    <div class="live-table-meta">👤 ${o.waiter_name || "—"}<br>🕐 ${o.ordered_at ? fmtTime(o.ordered_at) : "—"}</div>
    ${itemsHtml}
    <div class="live-table-total">${euro(o.total)}</div>
  </div>`;
}

function renderOrderCard(o) {
  return `<div class="order-card">
    <div class="order-card-head">
      <span class="order-card-title">Tavolina ${o.table_number || "—"}</span>
      <span class="order-card-total">${euro(o.total)}</span>
    </div>
    <div class="order-card-meta">
      <span>🕐 ${fmtTime(o.closed_at)}</span>
      <span>👤 ${o.waiter_name || "—"}</span>
      ${o.receipt_number ? `<span>🧾 ${o.receipt_number}</span>` : ""}
    </div>
    ${renderItemsTable(o.items_json)}
  </div>`;
}

async function loadClient() {
  const data = await api("/api/owner/client");
  const { client, links = {}, features = {} } = data;
  if (client) {
    document.getElementById("biz-name").textContent = client.emri || "Paneli i pronarit";
    const typeLbl = client.tipi === "kafene" ? "Kafene" : client.tipi === "restorant" ? "Restorant" : "Lokali";
    document.getElementById("biz-sub").textContent =
      typeLbl + (client.adresa ? ` · ${client.adresa}` : "");
  } else {
    document.getElementById("biz-sub").textContent = "Shitjet dhe raportet e lokalit tuaj";
  }

  const rows = [
    ["owner-link-waiter-row", "owner-waiter-url", features.waiter, links.waiter || data.waiter_url],
    ["owner-link-kitchen-row", "owner-kitchen-url", features.kds, links.kitchen || data.kitchen_url],
    ["owner-link-bar-row", "owner-bar-url", features.kds, links.bar],
    ["owner-link-kiosk-row", "owner-kiosk-url", features.kiosk, links.kiosk],
  ];
  for (const [rowId, inputId, enabled, url] of rows) {
    const row = document.getElementById(rowId);
    if (row) row.classList.toggle("hidden", !enabled);
    const input = document.getElementById(inputId);
    if (input) input.value = enabled ? (url || "") : "";
  }
  const empty = document.getElementById("owner-links-empty");
  if (empty) {
    empty.classList.toggle("hidden", !!(features.waiter || features.kds || features.kiosk));
  }
}

async function kopjoLinkun(inputId, btn) {
  const val = document.getElementById(inputId).value;
  if (!val) return;
  try {
    await navigator.clipboard.writeText(val);
    const orig = btn.textContent;
    btn.textContent = "U kopjua!";
    setTimeout(() => { btn.textContent = orig; }, 1500);
  } catch {
    document.getElementById(inputId).select();
    document.execCommand("copy");
  }
}

document.getElementById("btn-owner-copy-waiter").addEventListener("click", function () {
  kopjoLinkun("owner-waiter-url", this);
});
document.getElementById("btn-owner-copy-kitchen").addEventListener("click", function () {
  kopjoLinkun("owner-kitchen-url", this);
});
document.getElementById("btn-owner-copy-bar")?.addEventListener("click", function () {
  kopjoLinkun("owner-bar-url", this);
});
document.getElementById("btn-owner-copy-kiosk")?.addEventListener("click", function () {
  kopjoLinkun("owner-kiosk-url", this);
});

async function loadStats() {
  const s = await api("/api/owner/stats");
  document.getElementById("stats").innerHTML = `
    <div class="stat owner-stat"><div class="val">${euro(s.sot.total)}</div><div class="lbl">Sot (${s.sot.count})</div></div>
    <div class="stat owner-stat"><div class="val">${euro(s.java.total)}</div><div class="lbl">Kjo javë (${s.java.count})</div></div>
    <div class="stat owner-stat"><div class="val">${euro(s.muaj.total)}</div><div class="lbl">Ky muaj (${s.muaj.count})</div></div>`;
}

async function loadOrderFilters() {
  const { waiters, tables } = await api("/api/owner/orders/filters");
  const wSel = document.getElementById("filter-waiter");
  const tSel = document.getElementById("filter-table");
  const wVal = wSel.value;
  const tVal = tSel.value;
  wSel.innerHTML = '<option value="">Të gjithë</option>' +
    (waiters || []).map(w => `<option value="${w}">${w}</option>`).join("");
  tSel.innerHTML = '<option value="">Të gjitha</option>' +
    (tables || []).map(t => `<option value="${t}">Tavolina ${t}</option>`).join("");
  wSel.value = wVal;
  tSel.value = tVal;
}

async function loadLiveTables() {
  const data = await api("/api/owner/tables/live");
  const grid = document.getElementById("live-tables-grid");
  const updated = document.getElementById("live-tables-updated");
  if (!grid) return;
  grid.innerHTML = (data.tables || []).map(renderLiveTableCard).join("");
  if (updated && data.updated_at) {
    updated.textContent = `Përditësuar: ${fmtTime(data.updated_at)}`;
  }
}

async function loadOrders() {
  const q = new URLSearchParams({ limit: "50" });
  const waiter = document.getElementById("filter-waiter").value;
  const table = document.getElementById("filter-table").value;
  if (waiter) q.set("waiter", waiter);
  if (table) q.set("table", table);

  const { orders } = await api(`/api/owner/orders?${q}`);
  const el = document.getElementById("orders-list");
  if (!orders.length) {
    el.innerHTML = '<p style="color:var(--muted)">Nuk ka porosi për këtë filtër.</p>';
    return;
  }
  el.innerHTML = orders.map(renderOrderCard).join("");
}

async function loadReport() {
  const nga = document.getElementById("raport-nga").value;
  const deri = document.getElementById("raport-deri").value;
  const q = new URLSearchParams();
  if (nga) q.set("from", nga);
  if (deri) q.set("to", deri);
  const { report } = await api(`/api/owner/reports?${q}`);
  document.getElementById("report-summary").textContent =
    `Totali: ${euro(report.total)} · ${report.order_count} porosi`;

  const max = Math.max(...(report.by_day.map(d => d.total)), 1);
  document.getElementById("report-bars").innerHTML = report.by_day.map(d => `
    <div class="report-bar">
      <span style="width:4.5rem">${d.date.slice(5)}</span>
      <div class="bar"><div class="fill" style="width:${Math.round((d.total / max) * 100)}%"></div></div>
      <span>${euro(d.total)}</span>
    </div>`).join("") || '<p style="color:var(--muted)">Nuk ka të dhëna për këtë periudhë.</p>';

  document.getElementById("report-table").innerHTML = report.orders.length
    ? report.orders.map(o => `<tr>
        <td>${fmtTime(o.closed_at)}</td>
        <td>T${o.table_number || "—"}</td>
        <td>${o.waiter_name || "—"}</td>
        <td>${euro(o.total)}</td>
      </tr>`).join("")
    : '<tr><td colspan="4" style="color:var(--muted)">—</td></tr>';
}

function formatLicenseKey(raw) {
  const clean = String(raw || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 16);
  const parts = [];
  for (let i = 0; i < clean.length; i += 4) parts.push(clean.slice(i, i + 4));
  return parts.join("-");
}

function setOwnerLicenseStatus(activated, text) {
  const box = document.getElementById("owner-license-status");
  const icon = document.getElementById("owner-license-icon");
  const label = document.getElementById("owner-license-text");
  if (!box || !icon || !label) return;
  box.className = "owner-license-status " + (activated ? "active" : "inactive");
  icon.textContent = activated ? "✅" : "❌";
  label.textContent = text || (activated ? "Licenca është aktive." : "Licenca nuk është aktive.");
}

async function loadLicense() {
  const msg = document.getElementById("owner-license-msg");
  if (msg) msg.textContent = "";
  try {
    const s = await api("/api/owner/license");
    document.getElementById("owner-license-device-id").value = s.machine_id || "— (aktivizoni në POS)";
    const keyEl = document.getElementById("owner-license-key");
    if (keyEl && s.license_key && !keyEl.value.trim()) {
      keyEl.value = s.license_key;
    }
    setOwnerLicenseStatus(!!s.activated, s.message || "");
  } catch (err) {
    setOwnerLicenseStatus(false, err.message || "Nuk u lexua licenca.");
  }
}

let currentZReport = null;

const VAT_LABELS = {
  A: "A — 18%",
  B: "B — 8%",
  C: "C — 0%",
  D: "D — E përjashtuar",
  E: "E — Tjeter",
};

function zReportDate() {
  const el = document.getElementById("zreport-date");
  return el?.value || new Date().toISOString().slice(0, 10);
}

function renderZReport(report) {
  currentZReport = report;
  const summary = document.getElementById("zreport-summary");
  if (summary) {
    summary.innerHTML = `
      <div class="zreport-stat"><div class="lbl">Kuponë fiskalë</div><div class="val">${report.coupon_count ?? 0}</div></div>
      <div class="zreport-stat"><div class="lbl">Qarkullimi ditor</div><div class="val">${euro(report.turnover_total)}</div></div>
      <div class="zreport-stat"><div class="lbl">Totali pa TVSH</div><div class="val">${euro(report.turnover_net)}</div></div>
      <div class="zreport-stat"><div class="lbl">TVSH total</div><div class="val">${euro(report.turnover_vat)}</div></div>
      <div class="zreport-stat"><div class="lbl">Gjendja e arkës</div><div class="val">${euro(report.cash_register_balance)}</div></div>
      <div class="zreport-stat"><div class="lbl">Qarkullimi kumulativ</div><div class="val">${euro(report.cumulative_turnover)}</div></div>`;
  }

  const vatEl = document.getElementById("zreport-vat");
  if (vatEl) {
    const rows = ["A", "B", "C", "D", "E"].map(k => {
      const v = report.vat_breakdown?.[k] || { net: 0, vat: 0, gross: 0 };
      return `<tr><td>${VAT_LABELS[k]}</td><td class="num">${euro(v.net)}</td><td class="num">${euro(v.vat)}</td><td class="num">${euro(v.gross)}</td></tr>`;
    }).join("");
    vatEl.innerHTML = `<strong>TVSH breakdown (A–E)</strong>
      <table><thead><tr><th>Kategoria</th><th>Neto</th><th>TVSH</th><th>Bruto</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  const salesEl = document.getElementById("zreport-sales");
  if (salesEl) {
    const sales = report.sales || [];
    salesEl.innerHTML = sales.length
      ? sales.map(s => `<tr>
          <td>${fmtTime(s.time)}</td>
          <td>T${s.table_number || "—"}</td>
          <td>${s.waiter_name || "—"}</td>
          <td class="num">${euro(s.total)}</td>
          <td>${s.coupon_nr || "—"}</td>
          <td>${s.payment_status || "—"}</td>
        </tr>`).join("")
      : '<tr><td colspan="6" style="color:var(--muted)">Nuk ka shitje për këtë ditë.</td></tr>';
  }
}

async function loadZReportHistory() {
  const el = document.getElementById("zreport-history");
  if (!el) return;
  try {
    const { history } = await api("/api/owner/z-report/history?limit=30");
    if (!history?.length) {
      el.innerHTML = '<p style="color:var(--muted)">Nuk ka raporte të ruajtura.</p>';
      return;
    }
    el.innerHTML = history.map(h => `
      <div class="zreport-history-item">
        <span><strong>${h.report_date}</strong> · ${h.coupon_count} kuponë · ${euro(h.turnover_total)}</span>
        <span>${h.closed_at ? "Mbyllur" : "Hapur"}</span>
      </div>`).join("");
  } catch {
    el.innerHTML = "";
  }
}

async function loadZReport() {
  const date = zReportDate();
  const { report } = await api(`/api/owner/z-report?date=${encodeURIComponent(date)}`);
  renderZReport(report);
  await loadZReportHistory();
}

async function loadFiscalSettings() {
  try {
    const { settings } = await api("/api/owner/fiscal/settings");
    const nr = document.getElementById("fiscal-nr");
    const com = document.getElementById("fiscal-com");
    const op = document.getElementById("fiscal-operator");
    if (nr) nr.value = settings.fiscal_nr || "";
    if (com) com.value = settings.fiscal_com_port || "";
    if (op) op.value = settings.fiscal_operator_name || "";
  } catch { /* */ }
}

async function exportZReport(format) {
  const date = zReportDate();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(
    `/api/owner/z-report/export?date=${encodeURIComponent(date)}&format=${encodeURIComponent(format)}`,
    { headers, credentials: "include" },
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.gabim || `HTTP ${res.status}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  if (format === "html" || format === "pdf") {
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return;
  }
  const a = document.createElement("a");
  a.href = url;
  a.download = `z-report-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function printZReport() {
  const date = zReportDate();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(
    `/api/owner/z-report/export?date=${encodeURIComponent(date)}&format=html`,
    { headers, credentials: "include" },
  );
  if (!res.ok) throw new Error("Nuk u gjenerua raporti për printim.");
  const html = await res.text();
  const w = window.open("", "_blank", "noopener");
  if (!w) throw new Error("Lejoni popup për printim.");
  w.document.write(html);
  w.document.close();
  w.onload = () => w.print();
}

let ownerMenuCache = { items: [], categories: [] };

function setMenuMsg(text, ok) {
  const msg = document.getElementById("menu-msg");
  if (!msg) return;
  msg.textContent = text || "";
  msg.className = "owner-license-msg" + (text ? (ok ? " ok" : " err") : "");
}

function updateOwnerMenuSyncHint(syncedAt) {
  const hint = document.getElementById("menu-sync-hint");
  if (!hint) return;
  if (syncedAt) {
    ownerMenuCache.synced_at = syncedAt;
    hint.textContent = `Menuja u përditësua: ${fmtTime(syncedAt)} — kamarieri, tavolina, banaku dhe POS e marrin brenda ~15 sekondave.`;
  } else {
    hint.textContent = "Menuja do të shfaqet te kamarieri, tavolina dhe banaku pas ruajtjes.";
  }
}

function renderMenuCategoryOptions(categories) {
  const list = document.getElementById("menu-category-list");
  if (!list) return;
  list.innerHTML = (categories || []).map(c => `<option value="${c.replace(/"/g, "&quot;")}">`).join("");
}

function renderMenuTable() {
  const body = document.getElementById("menu-items-body");
  if (!body) return;
  const items = ownerMenuCache.items || [];
  if (!items.length) {
    body.innerHTML = '<tr><td colspan="5" style="color:var(--muted)">Nuk ka artikuj. Shtoni të parin më sipër ose sinkronizoni nga POS.</td></tr>';
    return;
  }

  body.innerHTML = items.map(item => {
    return `<tr class="${item.active ? "" : "inactive-row"}" data-id="${item.id}">
      <td><input type="text" class="menu-edit-name" value="${escAttr(item.name)}"></td>
      <td>
        <input type="text" class="menu-edit-category" list="menu-category-list" value="${escAttr(item.category)}">
      </td>
      <td><input type="number" class="menu-edit-price menu-price-input" min="0" step="0.01" value="${Number(item.price).toFixed(2)}"></td>
      <td><span class="menu-status ${item.active ? "active" : "inactive"}">${item.active ? "Aktiv" : "Joaktiv"}</span></td>
      <td>
        <div class="menu-row-actions">
          <button type="button" class="btn btn-primary btn-sm btn-menu-save">Ruaj</button>
          <button type="button" class="btn btn-ghost btn-sm btn-menu-toggle">${item.active ? "Fshih" : "Aktivizo"}</button>
          <button type="button" class="btn btn-danger btn-sm btn-menu-delete">Fshi</button>
        </div>
      </td>
    </tr>`;
  }).join("");

  body.querySelectorAll(".btn-menu-save").forEach(btn => {
    btn.addEventListener("click", () => saveMenuRow(btn.closest("tr")));
  });
  body.querySelectorAll(".btn-menu-toggle").forEach(btn => {
    btn.addEventListener("click", () => toggleMenuRow(btn.closest("tr")));
  });
  body.querySelectorAll(".btn-menu-delete").forEach(btn => {
    btn.addEventListener("click", () => deleteMenuRow(btn.closest("tr")));
  });
}

function escAttr(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

async function loadOwnerMenu() {
  const data = await api("/api/owner/menu");
  ownerMenuCache = {
    items: data.items || [],
    categories: data.categories || [],
    synced_at: data.synced_at,
  };
  renderMenuCategoryOptions(ownerMenuCache.categories);
  renderMenuTable();
  updateOwnerMenuSyncHint(data.synced_at);
}

async function saveMenuRow(row) {
  if (!row) return;
  const id = row.dataset.id;
  const name = row.querySelector(".menu-edit-name")?.value?.trim();
  const category = row.querySelector(".menu-edit-category")?.value?.trim();
  const price = Number(row.querySelector(".menu-edit-price")?.value);
  if (!name || !category) {
    setMenuMsg("Emri dhe kategoria janë të detyrueshme.", false);
    return;
  }
  try {
    setMenuMsg("");
    const { item, synced_at } = await api(`/api/owner/menu/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name, category, price }),
    });
    const idx = ownerMenuCache.items.findIndex(i => i.id === id);
    if (idx >= 0) ownerMenuCache.items[idx] = item;
    if (!ownerMenuCache.categories.includes(item.category)) {
      ownerMenuCache.categories.push(item.category);
      renderMenuCategoryOptions(ownerMenuCache.categories);
    }
    renderMenuTable();
    updateOwnerMenuSyncHint(synced_at);
    setMenuMsg("Artikulli u ruajt — shfaqet te tabletat e porosive.", true);
  } catch (err) {
    setMenuMsg(err.message, false);
  }
}

async function toggleMenuRow(row) {
  if (!row) return;
  const id = row.dataset.id;
  const item = ownerMenuCache.items.find(i => i.id === id);
  if (!item) return;
  try {
    setMenuMsg("");
    const { item: updated, synced_at } = await api(`/api/owner/menu/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: !item.active }),
    });
    item.active = updated.active;
    renderMenuTable();
    updateOwnerMenuSyncHint(synced_at);
    setMenuMsg(updated.active ? "Artikulli u aktivizua." : "Artikulli u fsheh nga tabletat.", true);
  } catch (err) {
    setMenuMsg(err.message, false);
  }
}

async function deleteMenuRow(row) {
  if (!row) return;
  const id = row.dataset.id;
  const name = row.querySelector(".menu-edit-name")?.value?.trim() || "artikullin";
  if (!confirm(`Fshi "${name}" përgjithmonë?`)) return;
  try {
    setMenuMsg("");
    const { synced_at } = await api(`/api/owner/menu/${id}`, { method: "DELETE" });
    ownerMenuCache.items = ownerMenuCache.items.filter(i => i.id !== id);
    renderMenuTable();
    updateOwnerMenuSyncHint(synced_at);
    setMenuMsg("Artikulli u fshi.", true);
  } catch (err) {
    setMenuMsg(err.message, false);
  }
}

let ownerVenueCache = { areas: [], staff: [], table_count: 0 };

function setVenueMsg(text, ok) {
  const msg = document.getElementById("venue-msg");
  if (!msg) return;
  msg.textContent = text || "";
  msg.className = "owner-license-msg" + (text ? (ok ? " ok" : " err") : "");
}

function updateVenueSyncHint(syncedAt, tableCount) {
  const hint = document.getElementById("venue-sync-hint");
  const fallback = document.getElementById("venue-fallback-count");
  if (fallback) fallback.textContent = String(tableCount ?? ownerVenueCache.table_count ?? "—");
  if (!hint) return;
  if (syncedAt) {
    ownerVenueCache.synced_at = syncedAt;
    hint.textContent = `U përditësua: ${fmtTime(syncedAt)} — kamarieri e merr brenda ~15 sekondave.`;
  } else {
    hint.textContent = "Ndryshimet shfaqen te tabletat e kamarierit pas ruajtjes.";
  }
}

function renderVenueAreas() {
  const body = document.getElementById("venue-areas-body");
  if (!body) return;
  const areas = ownerVenueCache.areas || [];
  if (!areas.length) {
    body.innerHTML = '<tr><td colspan="4" style="color:var(--muted)">Nuk ka hapësira. Shtoni Sallë, Terasë etj.</td></tr>';
    return;
  }
  body.innerHTML = areas.map(area => `
    <tr class="${area.active ? "" : "inactive-row"}" data-id="${area.id}">
      <td><input type="text" class="venue-edit-name" value="${escAttr(area.name)}"></td>
      <td><input type="number" class="venue-edit-count" min="1" max="30" value="${Number(area.table_count)}"></td>
      <td><span class="menu-status ${area.active ? "active" : "inactive"}">${area.active ? "Aktive" : "Joaktive"}</span></td>
      <td>
        <div class="menu-row-actions">
          <button type="button" class="btn btn-primary btn-sm btn-area-save">Ruaj</button>
          <button type="button" class="btn btn-ghost btn-sm btn-area-toggle">${area.active ? "Fshih" : "Aktivizo"}</button>
          <button type="button" class="btn btn-danger btn-sm btn-area-delete">Fshi</button>
        </div>
      </td>
    </tr>`).join("");
  body.querySelectorAll(".btn-area-save").forEach(btn => {
    btn.addEventListener("click", () => saveAreaRow(btn.closest("tr")));
  });
  body.querySelectorAll(".btn-area-toggle").forEach(btn => {
    btn.addEventListener("click", () => toggleAreaRow(btn.closest("tr")));
  });
  body.querySelectorAll(".btn-area-delete").forEach(btn => {
    btn.addEventListener("click", () => deleteAreaRow(btn.closest("tr")));
  });
}

function renderVenueStaff() {
  const body = document.getElementById("venue-staff-body");
  if (!body) return;
  const staff = ownerVenueCache.staff || [];
  if (!staff.length) {
    body.innerHTML = '<tr><td colspan="4" style="color:var(--muted)">Nuk ka staf. Shtoni kamarierë ose kuzhinierë.</td></tr>';
    return;
  }
  body.innerHTML = staff.map(member => `
    <tr class="${member.active ? "" : "inactive-row"}" data-id="${member.id}">
      <td><input type="text" class="venue-edit-staff-name" value="${escAttr(member.name)}"></td>
      <td>
        <select class="venue-edit-staff-role">
          <option value="waiter"${member.role === "waiter" ? " selected" : ""}>Kamarier</option>
          <option value="kitchen"${member.role === "kitchen" ? " selected" : ""}>Kuzhinier</option>
        </select>
      </td>
      <td><span class="menu-status ${member.active ? "active" : "inactive"}">${member.active ? "Aktiv" : "Joaktiv"}</span></td>
      <td>
        <div class="menu-row-actions">
          <button type="button" class="btn btn-primary btn-sm btn-staff-save">Ruaj</button>
          <button type="button" class="btn btn-ghost btn-sm btn-staff-toggle">${member.active ? "Fshih" : "Aktivizo"}</button>
          <button type="button" class="btn btn-danger btn-sm btn-staff-delete">Fshi</button>
        </div>
      </td>
    </tr>`).join("");
  body.querySelectorAll(".btn-staff-save").forEach(btn => {
    btn.addEventListener("click", () => saveStaffRow(btn.closest("tr")));
  });
  body.querySelectorAll(".btn-staff-toggle").forEach(btn => {
    btn.addEventListener("click", () => toggleStaffRow(btn.closest("tr")));
  });
  body.querySelectorAll(".btn-staff-delete").forEach(btn => {
    btn.addEventListener("click", () => deleteStaffRow(btn.closest("tr")));
  });
}

async function loadOwnerVenue() {
  const data = await api("/api/owner/venue");
  ownerVenueCache = {
    areas: data.areas || [],
    staff: data.staff || [],
    table_count: data.table_count || 0,
    synced_at: data.synced_at,
  };
  renderVenueAreas();
  renderVenueStaff();
  updateVenueSyncHint(data.synced_at, data.table_count);
}

async function saveAreaRow(row) {
  if (!row) return;
  const id = row.dataset.id;
  const name = row.querySelector(".venue-edit-name")?.value?.trim();
  const table_count = Number(row.querySelector(".venue-edit-count")?.value);
  if (!name) {
    setVenueMsg("Shkruani emrin e hapësirës.", false);
    return;
  }
  try {
    setVenueMsg("");
    const { area, synced_at } = await api(`/api/owner/venue/areas/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name, table_count }),
    });
    const idx = ownerVenueCache.areas.findIndex(a => a.id === id);
    if (idx >= 0) ownerVenueCache.areas[idx] = area;
    renderVenueAreas();
    updateVenueSyncHint(synced_at, ownerVenueCache.table_count);
    setVenueMsg("Hapësira u ruajt.", true);
  } catch (err) {
    setVenueMsg(err.message, false);
  }
}

async function toggleAreaRow(row) {
  if (!row) return;
  const id = row.dataset.id;
  const area = ownerVenueCache.areas.find(a => a.id === id);
  if (!area) return;
  try {
    setVenueMsg("");
    const { area: updated, synced_at } = await api(`/api/owner/venue/areas/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: !area.active }),
    });
    Object.assign(area, updated);
    renderVenueAreas();
    updateVenueSyncHint(synced_at);
    setVenueMsg(updated.active ? "Hapësira u aktivizua." : "Hapësira u fsheh.", true);
  } catch (err) {
    setVenueMsg(err.message, false);
  }
}

async function deleteAreaRow(row) {
  if (!row) return;
  const id = row.dataset.id;
  const name = row.querySelector(".venue-edit-name")?.value?.trim() || "hapësirën";
  if (!confirm(`Fshi "${name}"?`)) return;
  try {
    setVenueMsg("");
    const { synced_at } = await api(`/api/owner/venue/areas/${id}`, { method: "DELETE" });
    ownerVenueCache.areas = ownerVenueCache.areas.filter(a => a.id !== id);
    renderVenueAreas();
    updateVenueSyncHint(synced_at);
    setVenueMsg("Hapësira u fshi.", true);
  } catch (err) {
    setVenueMsg(err.message, false);
  }
}

async function saveStaffRow(row) {
  if (!row) return;
  const id = row.dataset.id;
  const name = row.querySelector(".venue-edit-staff-name")?.value?.trim();
  const role = row.querySelector(".venue-edit-staff-role")?.value;
  if (!name) {
    setVenueMsg("Shkruani emrin e stafit.", false);
    return;
  }
  try {
    setVenueMsg("");
    const { member, synced_at } = await api(`/api/owner/venue/staff/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name, role }),
    });
    const idx = ownerVenueCache.staff.findIndex(s => s.id === id);
    if (idx >= 0) ownerVenueCache.staff[idx] = member;
    renderVenueStaff();
    updateVenueSyncHint(synced_at);
    setVenueMsg("Stafi u ruajt.", true);
  } catch (err) {
    setVenueMsg(err.message, false);
  }
}

async function toggleStaffRow(row) {
  if (!row) return;
  const id = row.dataset.id;
  const member = ownerVenueCache.staff.find(s => s.id === id);
  if (!member) return;
  try {
    setVenueMsg("");
    const { member: updated, synced_at } = await api(`/api/owner/venue/staff/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: !member.active }),
    });
    Object.assign(member, updated);
    renderVenueStaff();
    updateVenueSyncHint(synced_at);
    setVenueMsg(updated.active ? "Stafi u aktivizua." : "Stafi u fsheh.", true);
  } catch (err) {
    setVenueMsg(err.message, false);
  }
}

async function deleteStaffRow(row) {
  if (!row) return;
  const id = row.dataset.id;
  const name = row.querySelector(".venue-edit-staff-name")?.value?.trim() || "anëtarin";
  if (!confirm(`Fshi "${name}"?`)) return;
  try {
    setVenueMsg("");
    const { synced_at } = await api(`/api/owner/venue/staff/${id}`, { method: "DELETE" });
    ownerVenueCache.staff = ownerVenueCache.staff.filter(s => s.id !== id);
    renderVenueStaff();
    updateVenueSyncHint(synced_at);
    setVenueMsg("Stafi u fshi.", true);
  } catch (err) {
    setVenueMsg(err.message, false);
  }
}

document.getElementById("owner-license-key")?.addEventListener("input", e => {
  const el = e.target;
  el.value = formatLicenseKey(el.value);
});

document.getElementById("btn-owner-copy-device-id")?.addEventListener("click", function () {
  kopjoLinkun("owner-license-device-id", this);
});

document.getElementById("btn-owner-license-save")?.addEventListener("click", async () => {
  const msg = document.getElementById("owner-license-msg");
  const license_key = formatLicenseKey(document.getElementById("owner-license-key").value);
  if (!license_key) {
    msg.textContent = "Shkruani çelësin e licencës.";
    msg.className = "owner-license-msg err";
    return;
  }
  try {
    const r = await api("/api/owner/license", {
      method: "PUT",
      body: JSON.stringify({ license_key }),
    });
    msg.textContent = r.info || "Çelësi u verifikua.";
    msg.className = "owner-license-msg ok";
    await loadLicense();
  } catch (err) {
    msg.textContent = err.message;
    msg.className = "owner-license-msg err";
  }
});

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    document.querySelectorAll(".panel-section").forEach(p => p.classList.add("hidden"));
    document.getElementById(`panel-${tab.dataset.tab}`).classList.remove("hidden");
    if (tab.dataset.tab === "tavolinat") loadLiveTables();
    if (tab.dataset.tab === "raportet") loadReport();
    if (tab.dataset.tab === "porosite") loadOrders();
    if (tab.dataset.tab === "menuja") loadOwnerMenu();
    if (tab.dataset.tab === "lokal") loadOwnerVenue();
    if (tab.dataset.tab === "zreport") {
      loadZReport();
      loadFiscalSettings();
    }
    if (tab.dataset.tab === "licenca") loadLicense();
  });
});

document.getElementById("btn-logout").addEventListener("click", async () => {
  try { await api("/api/auth/owner/logout", { method: "POST" }); } catch { /* */ }
  localStorage.removeItem("owner_token");
  location.href = "/owner/login";
});

document.getElementById("btn-raport").addEventListener("click", loadReport);
document.getElementById("btn-filter-orders").addEventListener("click", loadOrders);
document.getElementById("filter-waiter").addEventListener("change", loadOrders);
document.getElementById("filter-table").addEventListener("change", loadOrders);

document.getElementById("btn-zreport-refresh")?.addEventListener("click", loadZReport);
document.getElementById("zreport-date")?.addEventListener("change", loadZReport);
document.getElementById("btn-zreport-close")?.addEventListener("click", async () => {
  const date = zReportDate();
  if (!confirm(`Mbyll ditën ${date} dhe ruaj raportin ditor?`)) return;
  try {
    await api("/api/owner/z-report/close", {
      method: "POST",
      body: JSON.stringify({ date }),
    });
    await loadZReport();
    alert("Raporti ditor u ruajt.");
  } catch (err) {
    alert(err.message);
  }
});
document.getElementById("btn-zreport-print")?.addEventListener("click", () => {
  printZReport().catch(err => alert(err.message));
});
document.getElementById("btn-zreport-csv")?.addEventListener("click", () => {
  exportZReport("csv").catch(err => alert(err.message));
});
document.getElementById("btn-zreport-html")?.addEventListener("click", () => {
  exportZReport("html").catch(err => alert(err.message));
});
document.getElementById("btn-fiscal-save")?.addEventListener("click", async () => {
  const msg = document.getElementById("fiscal-msg");
  if (msg) {
    msg.textContent = "";
    msg.className = "owner-license-msg";
  }
  try {
    await api("/api/owner/fiscal/settings", {
      method: "PATCH",
      body: JSON.stringify({
        fiscal_nr: document.getElementById("fiscal-nr")?.value?.trim() || "",
        fiscal_com_port: document.getElementById("fiscal-com")?.value?.trim() || "",
        fiscal_operator_name: document.getElementById("fiscal-operator")?.value?.trim() || "",
      }),
    });
    if (msg) {
      msg.textContent = "Settings fiskale u ruajtën.";
      msg.className = "owner-license-msg ok";
    }
  } catch (err) {
    if (msg) {
      msg.textContent = err.message;
      msg.className = "owner-license-msg err";
    }
  }
});

document.getElementById("btn-menu-add")?.addEventListener("click", async () => {
  const name = document.getElementById("menu-add-name")?.value?.trim();
  const category = document.getElementById("menu-add-category")?.value?.trim();
  const price = Number(document.getElementById("menu-add-price")?.value);
  if (!name || !category) {
    setMenuMsg("Shkruani emrin dhe kategorinë.", false);
    return;
  }
  try {
    setMenuMsg("");
    const { item, synced_at } = await api("/api/owner/menu", {
      method: "POST",
      body: JSON.stringify({ name, category, price }),
    });
    ownerMenuCache.items.push(item);
    if (!ownerMenuCache.categories.includes(item.category)) {
      ownerMenuCache.categories.push(item.category);
    }
    document.getElementById("menu-add-name").value = "";
    document.getElementById("menu-add-price").value = "";
    renderMenuCategoryOptions(ownerMenuCache.categories);
    renderMenuTable();
    updateOwnerMenuSyncHint(synced_at);
    setMenuMsg("Artikulli u shtua — shfaqet te tabletat e porosive.", true);
  } catch (err) {
    setMenuMsg(err.message, false);
  }
});

document.getElementById("btn-area-add")?.addEventListener("click", async () => {
  const name = document.getElementById("area-add-name")?.value?.trim();
  const table_count = Number(document.getElementById("area-add-count")?.value);
  if (!name) {
    setVenueMsg("Shkruani emrin e hapësirës.", false);
    return;
  }
  try {
    setVenueMsg("");
    const { area, synced_at } = await api("/api/owner/venue/areas", {
      method: "POST",
      body: JSON.stringify({ name, table_count }),
    });
    ownerVenueCache.areas.push(area);
    document.getElementById("area-add-name").value = "";
    renderVenueAreas();
    updateVenueSyncHint(synced_at);
    setVenueMsg("Hapësira u shtua.", true);
  } catch (err) {
    setVenueMsg(err.message, false);
  }
});

document.getElementById("btn-staff-add")?.addEventListener("click", async () => {
  const name = document.getElementById("staff-add-name")?.value?.trim();
  const role = document.getElementById("staff-add-role")?.value || "waiter";
  if (!name) {
    setVenueMsg("Shkruani emrin e stafit.", false);
    return;
  }
  try {
    setVenueMsg("");
    const { member, synced_at } = await api("/api/owner/venue/staff", {
      method: "POST",
      body: JSON.stringify({ name, role }),
    });
    ownerVenueCache.staff.push(member);
    document.getElementById("staff-add-name").value = "";
    renderVenueStaff();
    updateVenueSyncHint(synced_at);
    setVenueMsg("Stafi u shtua.", true);
  } catch (err) {
    setVenueMsg(err.message, false);
  }
});

(async () => {
  registerServiceWorker();
  initPwaInstallBanner();

  if (!token) {
    location.href = "/owner/login";
    return;
  }
  try {
    await api("/api/auth/owner/me");
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    document.getElementById("raport-nga").value = weekAgo.toISOString().slice(0, 10);
    document.getElementById("raport-deri").value = today;
    const zDate = document.getElementById("zreport-date");
    if (zDate) zDate.value = today;
    await loadClient();
    await loadStats();
    await loadLiveTables();
    await loadOrderFilters();
    await loadOrders();
    setInterval(async () => {
      await loadStats();
      if (!document.getElementById("panel-tavolinat").classList.contains("hidden")) {
        await loadLiveTables();
      }
      if (!document.getElementById("panel-porosite").classList.contains("hidden")) {
        await loadOrderFilters();
        await loadOrders();
      }
    }, 15000);
  } catch {
    localStorage.removeItem("owner_token");
    location.href = "/owner/login";
  }
})();
