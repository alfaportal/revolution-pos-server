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
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

function itemSummary(items) {
  const arr = Array.isArray(items) ? items : [];
  return arr.map(i => `${i.quantity || 1}× ${i.name}`).join(", ") || "—";
}

async function loadClient() {
  const { client } = await api("/api/owner/client");
  if (client) {
    document.getElementById("biz-name").textContent = client.emri;
    document.getElementById("biz-sub").textContent =
      (client.tipi === "kafene" ? "Kafene" : "Restorant") +
      (client.adresa ? ` · ${client.adresa}` : "");
  }
}

async function loadStats() {
  const s = await api("/api/owner/stats");
  document.getElementById("stats").innerHTML = `
    <div class="stat owner-stat"><div class="val">${euro(s.sot.total)}</div><div class="lbl">Sot (${s.sot.count})</div></div>
    <div class="stat owner-stat"><div class="val">${euro(s.java.total)}</div><div class="lbl">Kjo javë (${s.java.count})</div></div>
    <div class="stat owner-stat"><div class="val">${euro(s.muaj.total)}</div><div class="lbl">Ky muaj (${s.muaj.count})</div></div>`;
}

async function loadOrders() {
  const { orders } = await api("/api/owner/orders?limit=25");
  const el = document.getElementById("orders-list");
  if (!orders.length) {
    el.innerHTML = '<p style="color:var(--muted)">Nuk ka porosi ende. Shitjet shfaqen kur POS-i dërgon të dhëna.</p>';
    return;
  }
  el.innerHTML = orders.map(o => `
    <div class="order-card">
      <div class="order-card-head">
        <span>T${o.table_number || "—"} · ${euro(o.total)}</span>
        <span class="order-card-meta">${fmtTime(o.closed_at)}</span>
      </div>
      <div class="order-card-meta">${o.waiter_name || "—"}${o.receipt_number ? ` · Faturë ${o.receipt_number}` : ""}</div>
      <div class="order-items">${itemSummary(o.items_json)}</div>
    </div>`).join("");
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
    await loadOrders();
    setInterval(async () => {
      await loadStats();
      if (!document.getElementById("panel-porosite").classList.contains("hidden")) {
        await loadOrders();
      }
    }, 30000);
  } catch {
    localStorage.removeItem("owner_token");
    location.href = "/owner/login";
  }
})();
