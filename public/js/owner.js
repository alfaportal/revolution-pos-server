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

window.ownerApi = api;

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
  const waiterLabel = o.waiter_name
    ? `${o.waiter_name}${o.waiter_id ? ` <small style="color:var(--muted)">#${String(o.waiter_id).slice(0, 8)}</small>` : ""}`
    : "—";
  return `<div class="order-card">
    <div class="order-card-head">
      <span class="order-card-title">Tavolina ${o.table_number || "—"}</span>
      <span class="order-card-total">${euro(o.total)}</span>
    </div>
    <div class="order-card-meta">
      <span>🕐 ${fmtTime(o.closed_at)}</span>
      <span>👤 ${waiterLabel}</span>
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
    ["owner-link-bar-row", "owner-bar-url", features.kds, links.bar || data.bar_url],
    ["owner-link-waiter-row", "owner-waiter-url", features.waiter, links.waiter || data.waiter_url],
    ["owner-link-kitchen-row", "owner-kitchen-url", features.kds, links.kitchen || data.kitchen_url],
    ["owner-link-kiosk-row", "owner-kiosk-url", features.kiosk, links.kiosk],
    ["owner-link-public-row", "owner-public-url", features.website, links.public_page],
  ];
  for (const [rowId, inputId, enabled, url] of rows) {
    const row = document.getElementById(rowId);
    if (row) row.classList.toggle("hidden", !enabled);
    const input = document.getElementById(inputId);
    if (input) input.value = enabled ? (url || "") : "";
  }
  const empty = document.getElementById("owner-links-empty");
  if (empty) {
    empty.classList.toggle("hidden", !!(features.waiter || features.kds || features.kiosk || features.website));
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
document.getElementById("btn-owner-copy-public")?.addEventListener("click", function () {
  kopjoLinkun("owner-public-url", this);
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

function renderOwnerTerminals(s) {
  const wrap = document.getElementById("owner-terminal-summary");
  const countEl = document.getElementById("owner-terminals-count");
  const warnEl = document.getElementById("owner-terminal-warning");
  const listEl = document.getElementById("owner-terminals-list");
  if (!wrap || !countEl || !warnEl || !listEl) return;

  const active = Number(s.active_terminal_count) || 0;
  const max = Number(s.max_terminals) || 1;
  const terminals = Array.isArray(s.terminals) ? s.terminals : [];

  if (!s.has_license) {
    wrap.classList.add("hidden");
    return;
  }

  wrap.classList.remove("hidden");
  countEl.textContent = `${active} / ${max} të lejuara`;

  const showLimitWarning = Boolean(s.terminal_limit_reached || s.terminal_over_limit);
  warnEl.classList.toggle("hidden", !showLimitWarning);

  if (!terminals.length) {
    listEl.innerHTML = '<p class="owner-terminals-empty">Asnjë terminal aktiv — aktivizoni licencën në POS.</p>';
    return;
  }

  listEl.innerHTML = `<table class="owner-terminals-table">
    <thead><tr><th>ID pajisje</th><th>Kompjuteri</th><th>Pamja e fundit</th></tr></thead>
    <tbody>${terminals.map(t => `<tr>
      <td class="mono">${escHtml(t.device_id || "—")}</td>
      <td>${escHtml(t.device_hostname || "—")}</td>
      <td>${t.last_seen_at ? fmtTime(t.last_seen_at) : "—"}</td>
    </tr>`).join("")}</tbody>
  </table>`;
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
    renderOwnerTerminals(s);
  } catch (err) {
    setOwnerLicenseStatus(false, err.message || "Nuk u lexua licenca.");
    renderOwnerTerminals({ has_license: false });
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
      <div class="zreport-stat"><div class="lbl">Pagesa Cash</div><div class="val">${euro(report.payment_totals?.cash)}</div></div>
      <div class="zreport-stat"><div class="lbl">Pagesa Kartë</div><div class="val">${euro(report.payment_totals?.karte)}</div></div>
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
          <td>${s.payment_label || "Cash"}</td>
          <td>${s.coupon_nr || "—"}</td>
          <td>${s.payment_status || "—"}</td>
        </tr>`).join("")
      : '<tr><td colspan="7" style="color:var(--muted)">Nuk ka shitje për këtë ditë.</td></tr>';
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
    const model = document.getElementById("fiscal-model");
    const enabled = document.getElementById("fiscal-enabled");
    if (nr) nr.value = settings.fiscal_nr || "";
    if (com) com.value = settings.fiscal_com_port || "";
    if (op) op.value = settings.fiscal_operator_name || "";
    if (model) model.value = settings.fiscal_device_model || "";
    if (enabled) enabled.checked = settings.fiscal_enabled !== false;
    await loadFiscalDiagnostics();
  } catch { /* */ }
}

function setFiscalConnStatus(state, label) {
  const el = document.getElementById("fiscal-conn-status");
  if (!el) return;
  el.className = "fiscal-conn-badge " + state;
  el.textContent = label;
}

function escHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function showFiscalDiagMsg(text, ok, suggestions) {
  const msg = document.getElementById("fiscal-diag-msg");
  const list = document.getElementById("fiscal-diag-suggestions");
  if (msg) {
    if (!text) {
      msg.textContent = "";
      msg.className = "fiscal-diag-msg hidden";
    } else {
      msg.textContent = text;
      msg.className = "fiscal-diag-msg " + (ok ? "ok" : "err");
    }
  }
  if (list) {
    if (!suggestions?.length) {
      list.innerHTML = "";
      list.classList.add("hidden");
    } else {
      list.innerHTML = suggestions.map(s => `<li>${escHtml(s)}</li>`).join("");
      list.classList.remove("hidden");
    }
  }
}

async function loadFiscalDiagnostics() {
  try {
    const { diagnostics } = await api("/api/owner/fiscal/diagnostics");
    if (!diagnostics.fiscal_enabled) {
      setFiscalConnStatus("unknown", "Çaktivizuar");
      return;
    }
    if (diagnostics.server_status === "connected") {
      setFiscalConnStatus("connected", "E lidhur");
      return;
    }
    if (diagnostics.server_status === "disconnected") {
      setFiscalConnStatus("disconnected", "E shkëputur");
      return;
    }
    setFiscalConnStatus("unknown", "E panjohur — testoni");
  } catch {
    setFiscalConnStatus("unknown", "E panjohur");
  }
}

async function runFiscalConnectionTest() {
  const testBtn = document.getElementById("btn-fiscal-test");
  const autoBtn = document.getElementById("btn-fiscal-autofind");
  const com = document.getElementById("fiscal-com")?.value || "";
  const enabled = document.getElementById("fiscal-enabled")?.checked !== false;

  if (!enabled) {
    showFiscalDiagMsg("Arka fiskale është çaktivizuar. Aktivizojeni për të testuar lidhjen.", false, []);
    setFiscalConnStatus("unknown", "Çaktivizuar");
    return;
  }

  if (!window.FiscalDiagnostics) {
    showFiscalDiagMsg("Moduli i diagnostikës nuk u ngarkua. Rifreskoni faqen.", false, []);
    return;
  }

  showFiscalDiagMsg("");
  setFiscalConnStatus("testing", "Duke testuar…");
  if (testBtn) testBtn.disabled = true;
  if (autoBtn) autoBtn.disabled = true;

  try {
    const result = await FiscalDiagnostics.testConnection(com);
    if (result.ok) {
      setFiscalConnStatus("connected", "E lidhur");
      showFiscalDiagMsg(result.message || "Lidhja me arkën fiskale u verifikua.", true, []);
      return;
    }
    setFiscalConnStatus("disconnected", "E shkëputur");
    showFiscalDiagMsg(result.error || "Lidhja dështoi.", false, result.suggestions || []);
  } catch (err) {
    setFiscalConnStatus("disconnected", "E shkëputur");
    showFiscalDiagMsg(err.message || "Gabim gjatë testit.", false, FiscalDiagnostics.comSuggestions(com).length
      ? [`Provo ${FiscalDiagnostics.comSuggestions(com).join(", ")}`, "Kontrollo kabllot"]
      : ["Kontrollo kabllot"]);
  } finally {
    if (testBtn) testBtn.disabled = false;
    if (autoBtn) autoBtn.disabled = false;
  }
}

async function runFiscalAutoFind() {
  const testBtn = document.getElementById("btn-fiscal-test");
  const autoBtn = document.getElementById("btn-fiscal-autofind");
  const comInput = document.getElementById("fiscal-com");

  if (!window.FiscalDiagnostics) {
    showFiscalDiagMsg("Moduli i diagnostikës nuk u ngarkua. Rifreskoni faqen.", false, []);
    return;
  }

  showFiscalDiagMsg("");
  setFiscalConnStatus("testing", "Duke skanuar…");
  if (testBtn) testBtn.disabled = true;
  if (autoBtn) autoBtn.disabled = true;

  try {
    const result = await FiscalDiagnostics.autoFindPort();
    if (result.ok) {
      setFiscalConnStatus("connected", "E lidhur");
      if (result.com_port && comInput) {
        comInput.value = result.com_port;
      }
      showFiscalDiagMsg(result.message || "Pajisja u gjet.", true, result.com_port ? [] : ["Ruajeni settings pas përditësimit të COM portit"]);
      return;
    }
    setFiscalConnStatus("disconnected", "E shkëputur");
    showFiscalDiagMsg(result.error || "Nuk u gjet arkë fiskale.", false, result.suggestions || []);
  } catch (err) {
    setFiscalConnStatus("disconnected", "E shkëputur");
    showFiscalDiagMsg(err.message || "Skanimi dështoi.", false, ["Kontrollo kabllot", "Provo COM1, COM2, COM4"]);
  } finally {
    if (testBtn) testBtn.disabled = false;
    if (autoBtn) autoBtn.disabled = false;
  }
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
    body.innerHTML = '<tr><td colspan="6" style="color:var(--muted)">Nuk ka artikuj. Shtoni të parin më sipër ose sinkronizoni nga POS.</td></tr>';
    return;
  }

  body.innerHTML = items.map(item => {
    const photoCell = item.has_photo
      ? `<img class="menu-photo-thumb" src="/api/owner/menu/${item.id}/photo" alt="">`
      : `<div class="menu-photo-placeholder">📷</div>`;
    return `<tr class="${item.active ? "" : "inactive-row"}" data-id="${item.id}">
      <td class="menu-photo-cell">
        ${photoCell}
        <div class="menu-photo-actions">
          <label class="btn btn-ghost btn-sm menu-photo-upload" for="menu-photo-${item.id}">${item.has_photo ? "Ndrysho foto" : "Shto foto"}</label>
          <input type="file" id="menu-photo-${item.id}" class="menu-photo-input" accept="image/png,image/jpeg,image/jpg" hidden data-id="${item.id}">
          ${item.has_photo ? `<button type="button" class="btn btn-ghost btn-sm btn-menu-photo-remove" data-id="${item.id}">Hiq foton</button>` : ""}
        </div>
      </td>
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
  body.querySelectorAll(".menu-photo-input").forEach(input => {
    input.addEventListener("change", () => uploadMenuPhoto(input));
  });
  body.querySelectorAll(".btn-menu-photo-remove").forEach(btn => {
    btn.addEventListener("click", () => removeMenuPhoto(btn.dataset.id));
  });
}

async function readImageFile(file, maxBytes, label) {
  if (!file) return null;
  if (file.size > maxBytes) {
    throw new Error(`${label} max ${Math.round(maxBytes / 1024)} KB.`);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Nuk u lexua skedari."));
    reader.readAsDataURL(file);
  });
}

async function uploadMenuPhoto(input) {
  const id = input.dataset.id;
  const file = input.files?.[0];
  input.value = "";
  if (!id || !file) return;
  try {
    setMenuMsg("");
    const photo = await readImageFile(file, 512_000, "Fotoja");
    const { item, synced_at } = await api(`/api/owner/menu/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ photo }),
    });
    const idx = ownerMenuCache.items.findIndex(i => i.id === id);
    if (idx >= 0) ownerMenuCache.items[idx] = item;
    renderMenuTable();
    updateOwnerMenuSyncHint(synced_at);
    setMenuMsg("Fotoja u ruajt — shfaqet te tavolina, kamarieri, banaku dhe faqja publike.", true);
  } catch (err) {
    setMenuMsg(err.message, false);
  }
}

async function removeMenuPhoto(id) {
  if (!id) return;
  try {
    setMenuMsg("");
    const { item, synced_at } = await api(`/api/owner/menu/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ photo: "" }),
    });
    const idx = ownerMenuCache.items.findIndex(i => i.id === id);
    if (idx >= 0) ownerMenuCache.items[idx] = item;
    renderMenuTable();
    updateOwnerMenuSyncHint(synced_at);
    setMenuMsg("Fotoja u hoq — shfaqet fotoja e paracaktuar e katalogut (nëse ka).", true);
  } catch (err) {
    setMenuMsg(err.message, false);
  }
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

window.loadOwnerMenu = loadOwnerMenu;

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

let ownerWaitersCache = [];

function setWaitersMsg(text, ok) {
  const msg = document.getElementById("waiters-msg");
  if (!msg) return;
  msg.textContent = text || "";
  msg.className = "owner-license-msg" + (text ? (ok ? " ok" : " err") : "");
}

function updateWaitersSyncHint(syncedAt) {
  const hint = document.getElementById("waiters-sync-hint");
  if (!hint) return;
  hint.textContent = syncedAt
    ? `U përditësua: ${fmtTime(syncedAt)} — tabletat e kamarierit e marrin brenda ~15 sekondave.`
    : "Kamarierët me PIN shfaqen menjëherë te hyrja e tabletit.";
}

function renderWaitersTable() {
  const body = document.getElementById("waiters-body");
  if (!body) return;
  const waiters = ownerWaitersCache || [];
  if (!waiters.length) {
    body.innerHTML = '<tr><td colspan="5" style="color:var(--muted)">Nuk ka kamarierë. Shtoni të parin më sipër.</td></tr>';
    return;
  }
  body.innerHTML = waiters.map(w => `
    <tr class="${w.active ? "" : "inactive-row"}" data-id="${w.id}">
      <td><input type="text" class="waiter-edit-name" value="${escAttr(w.name)}"></td>
      <td><span class="menu-status active">****</span></td>
      <td>
        ${w.waiter_url
          ? `<div class="link-actions" style="flex-wrap:wrap;gap:0.35rem">
              <input type="text" class="waiter-link-input" readonly value="${escAttr(w.waiter_url)}" style="font-family:monospace;font-size:0.7rem;min-width:160px;flex:1">
              <button type="button" class="btn btn-ghost btn-sm btn-waiter-copy-link">Kopjo</button>
            </div>`
          : '<span style="color:var(--muted)">—</span>'}
      </td>
      <td><span class="menu-status ${w.active ? "active" : "inactive"}">${w.active ? "Aktiv" : "Joaktiv"}</span></td>
      <td>
        <div class="menu-row-actions">
          <button type="button" class="btn btn-primary btn-sm btn-waiter-save">Ruaj</button>
          <button type="button" class="btn btn-ghost btn-sm btn-waiter-pin">Rivendos PIN</button>
          <button type="button" class="btn btn-ghost btn-sm btn-waiter-toggle">${w.active ? "Fshih" : "Aktivizo"}</button>
          <button type="button" class="btn btn-danger btn-sm btn-waiter-delete">Fshi</button>
        </div>
      </td>
    </tr>`).join("");
  body.querySelectorAll(".btn-waiter-copy-link").forEach(btn => {
    btn.addEventListener("click", async function () {
      const val = btn.closest("tr")?.querySelector(".waiter-link-input")?.value || "";
      if (!val) return;
      try {
        await navigator.clipboard.writeText(val);
        const orig = this.textContent;
        this.textContent = "U kopjua!";
        setTimeout(() => { this.textContent = orig; }, 1500);
      } catch {
        prompt("Kopjoni linkun:", val);
      }
    });
  });
  body.querySelectorAll(".btn-waiter-save").forEach(btn => {
    btn.addEventListener("click", () => saveWaiterRow(btn.closest("tr")));
  });
  body.querySelectorAll(".btn-waiter-pin").forEach(btn => {
    btn.addEventListener("click", () => resetWaiterPin(btn.closest("tr")));
  });
  body.querySelectorAll(".btn-waiter-toggle").forEach(btn => {
    btn.addEventListener("click", () => toggleWaiterRow(btn.closest("tr")));
  });
  body.querySelectorAll(".btn-waiter-delete").forEach(btn => {
    btn.addEventListener("click", () => deleteWaiterRow(btn.closest("tr")));
  });
}

async function loadOwnerWaiters() {
  const data = await api("/api/owner/waiters");
  ownerWaitersCache = data.waiters || [];
  renderWaitersTable();
  updateWaitersSyncHint(data.synced_at);
}

async function saveWaiterRow(row) {
  if (!row) return;
  const id = row.dataset.id;
  const name = row.querySelector(".waiter-edit-name")?.value?.trim();
  if (!name) {
    setWaitersMsg("Shkruani emrin e kamarierit.", false);
    return;
  }
  try {
    setWaitersMsg("");
    const { waiter, synced_at } = await api(`/api/owner/waiters/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
    const idx = ownerWaitersCache.findIndex(w => w.id === id);
    if (idx >= 0) ownerWaitersCache[idx] = waiter;
    renderWaitersTable();
    updateWaitersSyncHint(synced_at);
    setWaitersMsg("Kamarieri u ruajt.", true);
  } catch (err) {
    setWaitersMsg(err.message, false);
  }
}

async function resetWaiterPin(row) {
  if (!row) return;
  const id = row.dataset.id;
  const name = row.querySelector(".waiter-edit-name")?.value?.trim() || "kamarierin";
  const pin = window.prompt(`PIN i ri (4 shifra) për ${name}:`);
  if (pin == null) return;
  if (!/^\d{4}$/.test(String(pin).trim())) {
    setWaitersMsg("PIN duhet të jetë 4 shifra.", false);
    return;
  }
  try {
    setWaitersMsg("");
    const { synced_at } = await api(`/api/owner/waiters/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ pin: String(pin).trim() }),
    });
    updateWaitersSyncHint(synced_at);
    setWaitersMsg("PIN u rivendos.", true);
  } catch (err) {
    setWaitersMsg(err.message, false);
  }
}

async function toggleWaiterRow(row) {
  if (!row) return;
  const id = row.dataset.id;
  const waiter = ownerWaitersCache.find(w => w.id === id);
  if (!waiter) return;
  try {
    setWaitersMsg("");
    const { waiter: updated, synced_at } = await api(`/api/owner/waiters/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: !waiter.active }),
    });
    Object.assign(waiter, updated);
    renderWaitersTable();
    updateWaitersSyncHint(synced_at);
    setWaitersMsg(updated.active ? "Kamarieri u aktivizua." : "Kamarieri u çaktivizua.", true);
  } catch (err) {
    setWaitersMsg(err.message, false);
  }
}

async function deleteWaiterRow(row) {
  if (!row) return;
  const id = row.dataset.id;
  const name = row.querySelector(".waiter-edit-name")?.value?.trim() || "kamarierin";
  if (!confirm(`Fshi ${name}?`)) return;
  try {
    setWaitersMsg("");
    const { synced_at } = await api(`/api/owner/waiters/${id}`, { method: "DELETE" });
    ownerWaitersCache = ownerWaitersCache.filter(w => w.id !== id);
    renderWaitersTable();
    updateWaitersSyncHint(synced_at);
    setWaitersMsg("Kamarieri u fshi.", true);
  } catch (err) {
    setWaitersMsg(err.message, false);
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

const tableQrCache = new Map();

function setTableQrMsg(text, ok) {
  const msg = document.getElementById("table-qr-msg");
  if (!msg) return;
  msg.textContent = text || "";
  msg.className = "owner-license-msg" + (text ? (ok ? " ok" : " err") : "");
}

function renderTableQrPreview(table, dataUrl) {
  const cell = document.querySelector(`[data-qr-preview="${table}"]`);
  if (!cell) return;
  if (dataUrl) {
    cell.innerHTML = `<img src="${dataUrl}" alt="QR T${table}" class="table-qr-preview-img">`;
  } else {
    cell.innerHTML = '<span class="links-hint">—</span>';
  }
}

async function generateTableQr(table, btn) {
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Duke gjeneruar…";
  }
  try {
    setTableQrMsg("");
    const data = await api(`/api/owner/kiosk/qrs/${table}`);
    tableQrCache.set(table, data);
    renderTableQrPreview(table, data.data_url);
    setTableQrMsg(`QR për T${table} u gjenerua.`, true);
  } catch (err) {
    setTableQrMsg(err.message, false);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Gjenero QR Code";
    }
  }
}

function bindTableQrActions() {
  document.querySelectorAll("[data-generate-qr]").forEach(btn => {
    btn.addEventListener("click", () => generateTableQr(Number(btn.dataset.generateQr), btn));
  });
  document.querySelectorAll("[data-download-qr]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const table = btn.dataset.downloadQr;
      try {
        setTableQrMsg("");
        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`/api/owner/kiosk/qrs/${table}/png`, {
          headers,
          credentials: "include",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.gabim || "Shkarkimi dështoi.");
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `qr-tavolina-${table}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setTableQrMsg(`QR për T${table} u shkarkua (PNG).`, true);
      } catch (err) {
        setTableQrMsg(err.message, false);
      }
    });
  });
  document.querySelectorAll("[data-print-qr]").forEach(btn => {
    btn.addEventListener("click", () => {
      const table = btn.dataset.printQr;
      window.open(`/api/owner/kiosk/qrs/${table}/print`, "_blank", "noopener");
    });
  });
  document.querySelectorAll("[data-copy-qr-url]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const url = btn.dataset.copyQrUrl;
      if (!url) return;
      try {
        await navigator.clipboard.writeText(url);
        setTableQrMsg("URL u kopjua.", true);
      } catch {
        setTableQrMsg("Nuk u kopjua URL.", false);
      }
    });
  });
}

async function loadTableQrPanel() {
  const body = document.getElementById("table-qr-body");
  const card = document.getElementById("table-qr-card");
  const slugEl = document.getElementById("table-qr-slug");
  if (!body || !card) return;

  body.innerHTML = '<tr><td colspan="4" class="links-hint">Duke ngarkuar tavolinat…</td></tr>';
  setTableQrMsg("");
  tableQrCache.clear();
  card.hidden = false;

  try {
    const data = await api("/api/owner/kiosk/qrs");
    if (slugEl) slugEl.textContent = data.slug || "—";

    if (!data.tables?.length) {
      body.innerHTML = '<tr><td colspan="4" class="links-hint">Nuk ka tavolina. Shtoni hapësira te skeda Lokal &amp; Stafi ose rritni numrin e tavolinave.</td></tr>';
      return;
    }

    data.tables.forEach(t => tableQrCache.set(t.table, t));

    body.innerHTML = data.tables.map(t => `
      <tr data-table="${t.table}">
        <td><strong>T${t.table}</strong></td>
        <td>
          <code class="table-qr-url">${escAttr(t.url)}</code>
          <button type="button" class="btn btn-ghost btn-sm" data-copy-qr-url="${escAttr(t.url)}">Kopjo</button>
        </td>
        <td data-qr-preview="${t.table}">
          <img src="${escAttr(t.data_url)}" alt="QR T${t.table}" class="table-qr-preview-img" width="96" height="96">
        </td>
        <td class="col-actions table-qr-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-download-qr="${t.table}">Shkarko QR</button>
          <button type="button" class="btn btn-ghost btn-sm" data-print-qr="${t.table}">Printo</button>
        </td>
      </tr>`).join("");

    bindTableQrActions();
    setTableQrMsg(`${data.count} QR kode për lokalin tuaj (slug: ${data.slug || "—"}).`, true);
  } catch (err) {
    body.innerHTML = "";
    const needsUpgrade = /paketa|kiosk/i.test(err.message || "");
    setTableQrMsg(
      needsUpgrade
        ? "QR kiosk kërkon Pako 2 ose më lart. Kontaktoni administratorin për upgrade."
        : (err.message || "QR nuk u ngarkuan."),
      false,
    );
  }
}

document.getElementById("btn-print-all-table-qrs")?.addEventListener("click", () => {
  window.open("/api/owner/kiosk/qrs/print", "_blank", "noopener");
});

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
    await loadTableQrPanel();
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
    await loadTableQrPanel();
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
    await loadTableQrPanel();
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

const PUBLIC_DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const PUBLIC_DAY_LABELS = {
  mon: "E hënë",
  tue: "E martë",
  wed: "E mërkurë",
  thu: "E enjte",
  fri: "E premte",
  sat: "E shtunë",
  sun: "E diel",
};

let publicPageLogoData = undefined;
let publicPageLogoDirty = false;
let publicCoverData = undefined;
let publicCoverDirty = false;
let publicGalleryData = [];
let publicGalleryDirty = false;
let publicReviewsData = [];

function readImageFile(file, maxBytes, onDone) {
  if (!file) return;
  if (file.size > maxBytes) {
    setPublicPageMsg(`Skedari max ${Math.round(maxBytes / 1024)} KB.`, false);
    return;
  }
  const reader = new FileReader();
  reader.onload = () => onDone(reader.result);
  reader.readAsDataURL(file);
}

function updatePublicCoverPreview(dataUrl) {
  const img = document.getElementById("public-cover-preview");
  const ph = document.getElementById("public-cover-placeholder");
  if (dataUrl) {
    img.src = dataUrl;
    img.classList.remove("hidden");
    ph?.classList.add("hidden");
  } else {
    img.removeAttribute("src");
    img.classList.add("hidden");
    ph?.classList.remove("hidden");
  }
}

function renderPublicGalleryGrid() {
  const grid = document.getElementById("public-gallery-grid");
  const input = document.getElementById("public-gallery-input");
  if (!grid) return;
  grid.innerHTML = publicGalleryData.map((url, idx) => `
    <div class="public-gallery-item">
      <img src="${escAttr(url)}" alt="Galeri ${idx + 1}">
      <button type="button" class="btn btn-danger btn-sm" data-gallery-remove="${idx}">×</button>
    </div>
  `).join("");
  grid.querySelectorAll("[data-gallery-remove]").forEach(btn => {
    btn.addEventListener("click", () => {
      publicGalleryData.splice(Number(btn.dataset.galleryRemove), 1);
      publicGalleryDirty = true;
      renderPublicGalleryGrid();
    });
  });
  if (input) {
    input.disabled = publicGalleryData.length >= 5;
  }
}

function renderPublicReviewsEditor() {
  const list = document.getElementById("public-reviews-list");
  const addBtn = document.getElementById("btn-public-review-add");
  if (!list) return;

  list.innerHTML = publicReviewsData.map((row, idx) => {
    const stars = Math.max(1, Math.min(5, Number(row.stars) || 5));
    const starBtns = [1, 2, 3, 4, 5].map(n =>
      `<button type="button" class="${n <= stars ? "active" : ""}" data-review-star="${idx}" data-star="${n}" aria-label="${n} yje">★</button>`,
    ).join("");
    return `
      <div class="public-review-row" data-review-idx="${idx}">
        <div class="public-review-row-head">
          <input type="text" class="public-review-name" value="${escAttr(row.name || "")}" placeholder="Emri i klientit" maxlength="80">
          <div class="public-review-stars">${starBtns}</div>
          <button type="button" class="btn btn-danger btn-sm" data-review-remove="${idx}">Fshi</button>
        </div>
        <textarea class="public-review-text" rows="2" maxlength="500" placeholder="Koment (opsional)">${escHtml(row.text || "")}</textarea>
      </div>`;
  }).join("");

  list.querySelectorAll("[data-review-star]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.reviewStar);
      publicReviewsData[idx].stars = Number(btn.dataset.star);
      renderPublicReviewsEditor();
    });
  });
  list.querySelectorAll("[data-review-remove]").forEach(btn => {
    btn.addEventListener("click", () => {
      publicReviewsData.splice(Number(btn.dataset.reviewRemove), 1);
      renderPublicReviewsEditor();
    });
  });
  list.querySelectorAll(".public-review-name").forEach((el, idx) => {
    el.addEventListener("input", () => {
      publicReviewsData[idx].name = el.value;
    });
  });
  list.querySelectorAll(".public-review-text").forEach((el, idx) => {
    el.addEventListener("input", () => {
      publicReviewsData[idx].text = el.value;
    });
  });

  if (addBtn) {
    addBtn.disabled = publicReviewsData.length >= 5;
  }
}

function collectPublicReviews() {
  return publicReviewsData
    .map(r => ({
      name: String(r.name || "").trim(),
      stars: Math.max(1, Math.min(5, Number(r.stars) || 5)),
      text: String(r.text || "").trim(),
    }))
    .filter(r => r.name);
}

function setPublicPageMsg(text, ok) {
  const msg = document.getElementById("public-page-msg");
  if (!msg) return;
  msg.textContent = text || "";
  msg.className = "owner-license-msg" + (text ? (ok ? " ok" : " err") : "");
}

function renderPublicHoursGrid(hours) {
  const grid = document.getElementById("public-hours-grid");
  if (!grid) return;
  grid.innerHTML = PUBLIC_DAY_KEYS.map(key => {
    const row = hours?.[key] || { open: "09:00", close: "22:00", closed: false };
    return `
      <div class="public-hours-row" data-day="${key}">
        <span class="public-hours-day">${PUBLIC_DAY_LABELS[key]}</span>
        <label class="public-hours-closed">
          <input type="checkbox" class="public-hours-closed-cb" ${row.closed ? "checked" : ""}>
          Mbyllur
        </label>
        <input type="time" class="public-hours-open" value="${row.open || "09:00"}" ${row.closed ? "disabled" : ""}>
        <span class="public-hours-sep">–</span>
        <input type="time" class="public-hours-close" value="${row.close || "22:00"}" ${row.closed ? "disabled" : ""}>
      </div>`;
  }).join("");

  grid.querySelectorAll(".public-hours-closed-cb").forEach(cb => {
    cb.addEventListener("change", () => {
      const row = cb.closest(".public-hours-row");
      const disabled = cb.checked;
      row.querySelector(".public-hours-open").disabled = disabled;
      row.querySelector(".public-hours-close").disabled = disabled;
    });
  });
}

function collectPublicHours() {
  const hours = {};
  document.querySelectorAll(".public-hours-row").forEach(row => {
    const key = row.dataset.day;
    const closed = row.querySelector(".public-hours-closed-cb")?.checked;
    hours[key] = {
      open: row.querySelector(".public-hours-open")?.value || "09:00",
      close: row.querySelector(".public-hours-close")?.value || "22:00",
      closed: Boolean(closed),
    };
  });
  return hours;
}

function updatePublicLogoPreview(dataUrl) {
  const img = document.getElementById("public-logo-preview");
  const ph = document.getElementById("public-logo-placeholder");
  if (dataUrl) {
    img.src = dataUrl;
    img.classList.remove("hidden");
    ph?.classList.add("hidden");
  } else {
    img.removeAttribute("src");
    img.classList.add("hidden");
    ph?.classList.remove("hidden");
  }
}

function updatePublicSlugPreview(slug) {
  const preview = document.getElementById("public-slug-preview");
  if (preview) preview.textContent = slug || "slug";
}

function resetPublicPageQrPreview() {
  publicPageQrData = null;
  document.getElementById("public-page-qr-preview")?.classList.add("hidden");
  const img = document.getElementById("public-page-qr-img");
  if (img) img.removeAttribute("src");
  const urlEl = document.getElementById("public-page-qr-url");
  if (urlEl) urlEl.textContent = "";
  const dlBtn = document.getElementById("btn-public-download-qr");
  if (dlBtn) dlBtn.disabled = true;
}

let publicPageQrData = null;

async function loadPublicPage() {
  setPublicPageMsg("");
  try {
    const data = await api("/api/owner/public-page");
    const upgrade = document.getElementById("public-page-upgrade");
    if (upgrade) {
      if (data.website_enabled === false) {
        upgrade.textContent = "Paketa juaj nuk përfshin faqen publike. Kontaktoni administratorin.";
        upgrade.classList.remove("hidden");
      } else {
        upgrade.classList.add("hidden");
      }
    }

    document.getElementById("public-enabled").checked = data.public_enabled !== false;
    document.getElementById("public-description").value = data.public_description || "";
    document.getElementById("public-theme").value = data.public_theme_color || "#c2410c";
    document.getElementById("public-page-url").value = data.public_url || "";
    const slugInput = document.getElementById("public-page-slug");
    if (slugInput) slugInput.value = data.slug || "";
    updatePublicSlugPreview(data.slug || "");
    resetPublicPageQrPreview();
    const preview = document.getElementById("btn-public-preview");
    if (preview && data.public_url) preview.href = data.public_url;

    publicPageLogoData = data.logo_preview || null;
    publicPageLogoDirty = false;
    updatePublicLogoPreview(publicPageLogoData);

    publicCoverData = data.cover_preview || null;
    publicCoverDirty = false;
    updatePublicCoverPreview(publicCoverData);

    publicGalleryData = Array.isArray(data.gallery_previews) ? [...data.gallery_previews] : [];
    publicGalleryDirty = false;
    renderPublicGalleryGrid();

    publicReviewsData = Array.isArray(data.reviews)
      ? data.reviews.map(r => ({ name: r.name || "", stars: r.stars || 5, text: r.text || "" }))
      : [];
    renderPublicReviewsEditor();

    document.getElementById("public-daily-offer").value = data.daily_offer || "";
    document.getElementById("public-social-instagram").value = data.social_instagram || "";
    document.getElementById("public-social-facebook").value = data.social_facebook || "";
    document.getElementById("public-social-tiktok").value = data.social_tiktok || "";
    document.getElementById("public-whatsapp").value = data.public_whatsapp || "";

    renderPublicHoursGrid(data.public_hours);
  } catch (err) {
    setPublicPageMsg(err.message, false);
  }
}

async function savePublicPage() {
  setPublicPageMsg("Duke ruajtur…", true);
  try {
    const body = {
      public_enabled: document.getElementById("public-enabled").checked,
      public_description: document.getElementById("public-description").value,
      public_hours: collectPublicHours(),
      public_theme_color: document.getElementById("public-theme").value,
      public_daily_offer: document.getElementById("public-daily-offer").value,
      public_reviews: collectPublicReviews(),
      public_social_instagram: document.getElementById("public-social-instagram").value,
      public_social_facebook: document.getElementById("public-social-facebook").value,
      public_social_tiktok: document.getElementById("public-social-tiktok").value,
      public_whatsapp: document.getElementById("public-whatsapp").value,
    };
    if (publicPageLogoDirty) {
      body.public_logo = publicPageLogoData || "";
    }
    if (publicCoverDirty) {
      body.public_cover = publicCoverData || "";
    }
    if (publicGalleryDirty) {
      body.public_gallery = publicGalleryData;
    }
    const data = await api("/api/owner/public-page", {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    publicPageLogoData = data.logo_preview || null;
    publicPageLogoDirty = false;
    updatePublicLogoPreview(publicPageLogoData);
    publicCoverData = data.cover_preview || null;
    publicCoverDirty = false;
    updatePublicCoverPreview(publicCoverData);
    publicGalleryData = Array.isArray(data.gallery_previews) ? [...data.gallery_previews] : [];
    publicGalleryDirty = false;
    renderPublicGalleryGrid();
    publicReviewsData = Array.isArray(data.reviews)
      ? data.reviews.map(r => ({ name: r.name || "", stars: r.stars || 5, text: r.text || "" }))
      : [];
    renderPublicReviewsEditor();
    document.getElementById("public-page-url").value = data.public_url || "";
    setPublicPageMsg("Faqja publike u ruajt.", true);
  } catch (err) {
    setPublicPageMsg(err.message, false);
  }
}

document.getElementById("public-logo-input")?.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > 512_000) {
    setPublicPageMsg("Logo max 500 KB.", false);
    e.target.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    publicPageLogoData = reader.result;
    publicPageLogoDirty = true;
    updatePublicLogoPreview(publicPageLogoData);
    setPublicPageMsg("");
  };
  reader.readAsDataURL(file);
  e.target.value = "";
});

document.getElementById("btn-public-logo-remove")?.addEventListener("click", () => {
  publicPageLogoData = null;
  publicPageLogoDirty = true;
  updatePublicLogoPreview(null);
});

document.getElementById("public-cover-input")?.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  readImageFile(file, 800_000, (dataUrl) => {
    publicCoverData = dataUrl;
    publicCoverDirty = true;
    updatePublicCoverPreview(publicCoverData);
    setPublicPageMsg("");
  });
  e.target.value = "";
});

document.getElementById("btn-public-cover-remove")?.addEventListener("click", () => {
  publicCoverData = null;
  publicCoverDirty = true;
  updatePublicCoverPreview(null);
});

document.getElementById("public-gallery-input")?.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (publicGalleryData.length >= 5) {
    setPublicPageMsg("Maksimum 5 foto në galeri.", false);
    e.target.value = "";
    return;
  }
  readImageFile(file, 512_000, (dataUrl) => {
    publicGalleryData.push(dataUrl);
    publicGalleryDirty = true;
    renderPublicGalleryGrid();
    setPublicPageMsg("");
  });
  e.target.value = "";
});

document.getElementById("btn-public-review-add")?.addEventListener("click", () => {
  if (publicReviewsData.length >= 5) return;
  publicReviewsData.push({ name: "", stars: 5, text: "" });
  renderPublicReviewsEditor();
});

document.getElementById("btn-public-save")?.addEventListener("click", savePublicPage);

document.getElementById("public-page-slug")?.addEventListener("input", e => {
  updatePublicSlugPreview(e.target.value.trim().toLowerCase());
});

document.getElementById("btn-public-save-slug")?.addEventListener("click", async () => {
  const slug = document.getElementById("public-page-slug")?.value?.trim();
  const btn = document.getElementById("btn-public-save-slug");
  if (btn) btn.disabled = true;
  setPublicPageMsg("Duke ruajtur slug…", true);
  try {
    const data = await api("/api/owner/public-page/slug", {
      method: "PATCH",
      body: JSON.stringify({ slug }),
    });
    document.getElementById("public-page-slug").value = data.slug || slug;
    document.getElementById("public-page-url").value = data.public_url || "";
    updatePublicSlugPreview(data.slug || slug);
    resetPublicPageQrPreview();
    const preview = document.getElementById("btn-public-preview");
    if (preview && data.public_url) preview.href = data.public_url;
    await loadClient();
    setPublicPageMsg("Slug u ruajt.", true);
  } catch (err) {
    setPublicPageMsg(err.message, false);
  } finally {
    if (btn) btn.disabled = false;
  }
});

document.getElementById("btn-public-generate-qr")?.addEventListener("click", async () => {
  const btn = document.getElementById("btn-public-generate-qr");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Duke gjeneruar…";
  }
  setPublicPageMsg("");
  try {
    const data = await api("/api/owner/public-page/qr");
    publicPageQrData = data;
    const wrap = document.getElementById("public-page-qr-preview");
    const img = document.getElementById("public-page-qr-img");
    const urlEl = document.getElementById("public-page-qr-url");
    if (img && data.data_url) img.src = data.data_url;
    if (urlEl) urlEl.textContent = data.url || "";
    wrap?.classList.remove("hidden");
    document.getElementById("btn-public-download-qr").disabled = false;
    setPublicPageMsg("QR u gjenerua.", true);
  } catch (err) {
    setPublicPageMsg(err.message, false);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Gjenero QR Kod";
    }
  }
});

document.getElementById("btn-public-download-qr")?.addEventListener("click", async () => {
  const btn = document.getElementById("btn-public-download-qr");
  if (btn) btn.disabled = true;
  try {
    setPublicPageMsg("");
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch("/api/owner/public-page/qr/png", {
      headers,
      credentials: "include",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.gabim || "Shkarkimi dështoi.");
    }
    const blob = await res.blob();
    const slug = document.getElementById("public-page-slug")?.value?.trim() || "faqja";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-faqe-${slug}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setPublicPageMsg("QR u shkarkua (PNG).", true);
  } catch (err) {
    setPublicPageMsg(err.message, false);
  } finally {
    if (btn) btn.disabled = !publicPageQrData;
  }
});

document.getElementById("btn-public-copy-url")?.addEventListener("click", async () => {
  const url = document.getElementById("public-page-url")?.value;
  if (!url) return;
  try {
    await navigator.clipboard.writeText(url);
    setPublicPageMsg("URL u kopjua.", true);
  } catch {
    setPublicPageMsg("Nuk u kopjua.", false);
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
    if (tab.dataset.tab === "stoku" && typeof loadOwnerStock === "function") loadOwnerStock();
    if (tab.dataset.tab === "katalogu" && typeof loadOwnerCatalog === "function") loadOwnerCatalog();
    if (tab.dataset.tab === "kamarieret") loadOwnerWaiters();
    if (tab.dataset.tab === "qr-tavolinat") loadTableQrPanel();
    if (tab.dataset.tab === "lokal") loadOwnerVenue();
    if (tab.dataset.tab === "faqja") loadPublicPage();
    if (tab.dataset.tab === "zreport") loadZReport();
    if (tab.dataset.tab === "fiskale") loadFiscalSettings();
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
document.getElementById("btn-fiscal-test")?.addEventListener("click", () => {
  runFiscalConnectionTest();
});
document.getElementById("btn-fiscal-autofind")?.addEventListener("click", () => {
  runFiscalAutoFind();
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
        fiscal_device_model: document.getElementById("fiscal-model")?.value?.trim() || "",
        fiscal_enabled: document.getElementById("fiscal-enabled")?.checked !== false,
      }),
    });
    if (msg) {
      msg.textContent = "Settings fiskale u ruajtën.";
      msg.className = "owner-license-msg ok";
    }
    await loadFiscalDiagnostics();
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

document.getElementById("btn-waiter-add")?.addEventListener("click", async () => {
  const name = document.getElementById("waiter-add-name")?.value?.trim();
  const pin = document.getElementById("waiter-add-pin")?.value?.trim();
  if (!name) {
    setWaitersMsg("Shkruani emrin e kamarierit.", false);
    return;
  }
  if (!/^\d{4}$/.test(pin || "")) {
    setWaitersMsg("PIN duhet të jetë 4 shifra.", false);
    return;
  }
  try {
    setWaitersMsg("");
    const { waiter, synced_at } = await api("/api/owner/waiters", {
      method: "POST",
      body: JSON.stringify({ name, pin }),
    });
    ownerWaitersCache.push(waiter);
    document.getElementById("waiter-add-name").value = "";
    document.getElementById("waiter-add-pin").value = "";
    renderWaitersTable();
    updateWaitersSyncHint(synced_at);
    setWaitersMsg("Kamarieri u shtua.", true);
  } catch (err) {
    setWaitersMsg(err.message, false);
  }
});

const aiChatHistory = [];
let menuScanItems = [];
let menuScanPreviewUrl = null;

function appendAiChatBubble(text, role) {
  const box = document.getElementById("ai-chat-messages");
  if (!box) return;
  const bubble = document.createElement("div");
  bubble.className = `ai-chat-bubble ai-chat-bubble-${role === "user" ? "user" : "assistant"}`;
  bubble.textContent = text;
  box.appendChild(bubble);
  box.scrollTop = box.scrollHeight;
}

function setAiChatOpen(open) {
  const panel = document.getElementById("ai-chat-panel");
  const fab = document.getElementById("ai-chat-fab");
  if (!panel || !fab) return;
  panel.classList.toggle("hidden", !open);
  fab.setAttribute("aria-expanded", open ? "true" : "false");
  if (open) document.getElementById("ai-chat-input")?.focus();
}

function setAiChatLoading(loading) {
  document.getElementById("ai-chat-loading")?.classList.toggle("hidden", !loading);
  const sendBtn = document.getElementById("ai-chat-send");
  const input = document.getElementById("ai-chat-input");
  if (sendBtn) sendBtn.disabled = loading;
  if (input) input.disabled = loading;
}

async function sendAiChatMessage(message) {
  const text = String(message || "").trim();
  if (!text) return;

  appendAiChatBubble(text, "user");
  aiChatHistory.push({ role: "user", content: text });
  setAiChatLoading(true);

  try {
    const data = await api("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({
        message: text,
        history: aiChatHistory.slice(0, -1).slice(-12),
      }),
    });
    const reply = String(data.reply || "").trim() || "Nuk u mor përgjigje.";
    appendAiChatBubble(reply, "assistant");
    aiChatHistory.push({ role: "assistant", content: reply });
  } catch (err) {
    appendAiChatBubble(err.message || "Gabim gjatë komunikimit me AI.", "assistant");
  } finally {
    setAiChatLoading(false);
  }
}

function setMenuScanStatus(text, ok) {
  const el = document.getElementById("menu-scan-status");
  if (!el) return;
  if (!text) {
    el.textContent = "";
    el.className = "owner-license-msg";
    return;
  }
  el.textContent = text;
  el.className = `owner-license-msg ${ok ? "ok" : "err"}`;
}

function renderMenuScanItems() {
  const body = document.getElementById("menu-scan-items-body");
  const results = document.getElementById("menu-scan-results");
  if (!body || !results) return;

  if (!menuScanItems.length) {
    body.innerHTML = "";
    results.classList.add("hidden");
    return;
  }

  body.innerHTML = menuScanItems
    .map(
      (item, idx) => `<tr>
        <td><input type="text" class="menu-scan-name" data-idx="${idx}" value="${escAttr(item.name)}"></td>
        <td><input type="number" class="menu-scan-price" data-idx="${idx}" min="0" step="0.01" value="${Number(item.price || 0).toFixed(2)}"></td>
      </tr>`,
    )
    .join("");
  results.classList.remove("hidden");
}

function readMenuScanItemsFromDom() {
  return menuScanItems.map((item, idx) => {
    const name = document.querySelector(`.menu-scan-name[data-idx="${idx}"]`)?.value?.trim();
    const price = Number(document.querySelector(`.menu-scan-price[data-idx="${idx}"]`)?.value);
    return {
      name: name || item.name,
      price: Number.isFinite(price) ? price : item.price,
    };
  }).filter(item => item.name && Number.isFinite(item.price) && item.price >= 0);
}

function openMenuScanModal() {
  menuScanItems = [];
  setMenuScanStatus("", true);
  document.getElementById("menu-scan-results")?.classList.add("hidden");
  document.getElementById("menu-scan-loading")?.classList.add("hidden");
  document.getElementById("menu-scan-file").value = "";
  document.getElementById("btn-menu-scan-run").disabled = true;
  if (menuScanPreviewUrl) {
    URL.revokeObjectURL(menuScanPreviewUrl);
    menuScanPreviewUrl = null;
  }
  document.getElementById("menu-scan-preview-wrap")?.classList.add("hidden");
  document.getElementById("menu-scan-modal")?.classList.remove("hidden");
}

function closeMenuScanModal() {
  document.getElementById("menu-scan-modal")?.classList.add("hidden");
}

async function runMenuScan() {
  const file = document.getElementById("menu-scan-file")?.files?.[0];
  if (!file) {
    setMenuScanStatus("Zgjidhni një foto fillimisht.", false);
    return;
  }

  const runBtn = document.getElementById("btn-menu-scan-run");
  const loading = document.getElementById("menu-scan-loading");
  if (runBtn) runBtn.disabled = true;
  loading?.classList.remove("hidden");
  setMenuScanStatus("", true);
  document.getElementById("menu-scan-results")?.classList.add("hidden");

  try {
    const photo = await readImageFile(file, 4_000_000, "Foto e menusë");
    const data = await api("/api/ai/scan-menu", {
      method: "POST",
      body: JSON.stringify({ photo }),
    });
    menuScanItems = Array.isArray(data.items) ? data.items : [];
    renderMenuScanItems();
    setMenuScanStatus(
      `${menuScanItems.length} artikuj u gjetën (${Number(data.usage?.tokens_used || 0).toLocaleString("sq-AL")} tokenë).`,
      true,
    );
  } catch (err) {
    setMenuScanStatus(err.message, false);
  } finally {
    loading?.classList.add("hidden");
    if (runBtn) runBtn.disabled = false;
  }
}

async function importScannedMenuItems() {
  const items = readMenuScanItemsFromDom();
  const category = document.getElementById("menu-scan-category")?.value?.trim() || "Menu";
  if (!items.length) {
    setMenuScanStatus("Nuk ka artikuj për import.", false);
    return;
  }
  if (!category) {
    setMenuScanStatus("Shkruani kategorinë për import.", false);
    return;
  }

  const importBtn = document.getElementById("btn-menu-scan-import");
  if (importBtn) importBtn.disabled = true;
  setMenuScanStatus("Duke importuar artikujt…", true);

  try {
    let lastSynced = null;
    for (const item of items) {
      const { synced_at } = await api("/api/owner/menu", {
        method: "POST",
        body: JSON.stringify({ name: item.name, category, price: item.price }),
      });
      lastSynced = synced_at || lastSynced;
    }
    await loadOwnerMenu();
    if (lastSynced) updateOwnerMenuSyncHint(lastSynced);
    closeMenuScanModal();
    setMenuMsg(`${items.length} artikuj u importuan në menynë.`, true);
  } catch (err) {
    setMenuScanStatus(err.message, false);
  } finally {
    if (importBtn) importBtn.disabled = false;
  }
}

document.getElementById("ai-chat-fab")?.addEventListener("click", () => {
  const panel = document.getElementById("ai-chat-panel");
  setAiChatOpen(panel?.classList.contains("hidden"));
});

document.getElementById("ai-chat-close")?.addEventListener("click", () => setAiChatOpen(false));

document.getElementById("ai-chat-form")?.addEventListener("submit", async e => {
  e.preventDefault();
  const input = document.getElementById("ai-chat-input");
  const message = input?.value?.trim();
  if (!message) return;
  input.value = "";
  await sendAiChatMessage(message);
});

document.getElementById("btn-menu-scan-ai")?.addEventListener("click", openMenuScanModal);
document.getElementById("menu-scan-close")?.addEventListener("click", closeMenuScanModal);
document.getElementById("menu-scan-backdrop")?.addEventListener("click", closeMenuScanModal);
document.getElementById("btn-menu-scan-run")?.addEventListener("click", () => {
  runMenuScan().catch(err => setMenuScanStatus(err.message, false));
});
document.getElementById("btn-menu-scan-import")?.addEventListener("click", () => {
  importScannedMenuItems().catch(err => setMenuScanStatus(err.message, false));
});

document.getElementById("menu-scan-file")?.addEventListener("change", e => {
  const file = e.target.files?.[0];
  const previewWrap = document.getElementById("menu-scan-preview-wrap");
  const preview = document.getElementById("menu-scan-preview");
  const runBtn = document.getElementById("btn-menu-scan-run");
  if (!file) {
    if (runBtn) runBtn.disabled = true;
    previewWrap?.classList.add("hidden");
    return;
  }
  if (menuScanPreviewUrl) URL.revokeObjectURL(menuScanPreviewUrl);
  menuScanPreviewUrl = URL.createObjectURL(file);
  if (preview) preview.src = menuScanPreviewUrl;
  previewWrap?.classList.remove("hidden");
  if (runBtn) runBtn.disabled = false;
  menuScanItems = [];
  document.getElementById("menu-scan-results")?.classList.add("hidden");
  setMenuScanStatus("", true);
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
    await loadTableQrPanel();
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
