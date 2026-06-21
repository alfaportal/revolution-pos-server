let token = localStorage.getItem("owner_token") || "";

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
    document.getElementById("biz-name").textContent = client.emri;
    document.getElementById("biz-sub").textContent =
      (client.tipi === "kafene" ? "Kafene" : "Restorant") +
      (client.adresa ? ` · ${client.adresa}` : "");
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

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    document.querySelectorAll(".panel-section").forEach(p => p.classList.add("hidden"));
    document.getElementById(`panel-${tab.dataset.tab}`).classList.remove("hidden");
    if (tab.dataset.tab === "raportet") loadReport();
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
    await loadOrderFilters();
    await loadOrders();
    setInterval(async () => {
      await loadStats();
      if (!document.getElementById("panel-porosite").classList.contains("hidden")) {
        await loadOrderFilters();
        await loadOrders();
      }
    }, 30000);
  } catch {
    localStorage.removeItem("owner_token");
    location.href = "/owner/login";
  }
})();
