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
  const { client, waiter_url, kitchen_url } = data;
  if (client) {
    document.getElementById("biz-name").textContent = client.emri || "Paneli i pronarit";
    const typeLbl = client.tipi === "kafene" ? "Kafene" : client.tipi === "restorant" ? "Restorant" : "Lokali";
    document.getElementById("biz-sub").textContent =
      typeLbl + (client.adresa ? ` · ${client.adresa}` : "");
  } else {
    document.getElementById("biz-sub").textContent = "Shitjet dhe raportet e lokalit tuaj";
  }
  if (waiter_url) {
    document.getElementById("owner-waiter-url").value = waiter_url;
    document.getElementById("owner-kitchen-url").value = kitchen_url || "";
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
