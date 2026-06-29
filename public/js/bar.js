(function () {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const slug = parts[0] === "bar" ? parts[1] : "";
  const kitchenKey = new URLSearchParams(window.location.search).get("key") || "";

  const titleEl = document.getElementById("bar-title");
  const subEl = document.getElementById("bar-sub");
  const gridEl = document.getElementById("orders-grid");
  const emptyEl = document.getElementById("empty-state");
  const errorEl = document.getElementById("error-box");
  const countEl = document.getElementById("order-count");
  const syncEl = document.getElementById("last-sync");
  const tablesGridEl = document.getElementById("bar-tables-grid");
  const tablesUpdatedEl = document.getElementById("bar-tables-updated");

  let knownIds = new Set();
  let eventSource = null;

  function renderLiveTableCard(t) {
    if (t.status === "free") {
      return `<div class="bar-table-card free">
        <div class="bar-table-num">${escapeHtml(t.label)}</div>
        <div class="bar-table-status">E lirë</div>
      </div>`;
    }
    const o = t.order || {};
    const isQr = o.source_code === "table";
    const ready = o.order_status === "ready";
    const classes = ["bar-table-card", "occupied", isQr ? "qr" : "", ready ? "ready" : ""].filter(Boolean).join(" ");
    let status = isQr ? "🪑 QR" : "E zënë";
    if (ready) status = isQr ? "QR · Gati" : "Gati";
    const meta = o.accepted_by
      ? escapeHtml(o.accepted_by)
      : (isQr ? "Në pritje" : escapeHtml(o.waiter_name || "—"));
    return `<div class="${classes}">
      <div class="bar-table-num">${escapeHtml(t.label)}</div>
      <div class="bar-table-status">${status}</div>
      <div class="bar-table-total">${formatEuro(o.total)}</div>
      <div class="bar-table-meta" title="${meta}">${meta}</div>
    </div>`;
  }

  async function fetchLiveTables() {
    if (!slug || !kitchenKey || !tablesGridEl) return;
    try {
      const res = await fetch(`/api/kds/${encodeURIComponent(slug)}/bar/tables/live${apiQuery()}`, {
        headers: apiHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) return;
      const tables = data.tables || [];
      tablesGridEl.innerHTML = tables.length
        ? tables.map(renderLiveTableCard).join("")
        : '<p class="bar-tables-hint">Nuk ka tavolina të konfiguruara.</p>';
      if (tablesUpdatedEl && data.updated_at) {
        tablesUpdatedEl.textContent = `Përditësuar: ${formatTime(data.updated_at)}`;
      }
    } catch {
      /* ignore */
    }
  }

  async function refreshAll() {
    await Promise.all([fetchLiveTables(), fetchOrders()]);
  }

  function apiQuery() {
    return kitchenKey ? `?key=${encodeURIComponent(kitchenKey)}` : "";
  }

  function apiHeaders() {
    return kitchenKey ? { "x-kitchen-key": kitchenKey } : {};
  }

  function sourceMeta(order) {
    const device = String(order.device_id || "").toUpperCase();
    if (device === "WEB-PUBLIC") {
      const w = String(order.waiter_name || "").toLowerCase();
      if (w.startsWith("delivery")) return { icon: "🛵", label: "Delivery" };
      return { icon: "🥡", label: "Takeaway" };
    }
    if (device === "WEB-KIOSK") return { icon: "🪑", label: "Tavolinë" };
    if (device === "WEB-WAITER") return { icon: "📱", label: "Kamarier" };
    return { icon: "🖥️", label: "POS" };
  }

  function tableLabel(order) {
    const device = String(order.device_id || "").toUpperCase();
    if (device === "WEB-PUBLIC") {
      const w = String(order.waiter_name || "").toLowerCase();
      if (w.startsWith("delivery")) return "Delivery";
      if (w.startsWith("takeaway")) return "Takeaway";
      return "Online";
    }
    return `T${order.table_number || "?"}`;
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.remove("hidden");
    gridEl.innerHTML = "";
    emptyEl.classList.add("hidden");
  }

  function hideError() {
    errorEl.classList.add("hidden");
  }

  function formatTime(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleTimeString("sq-AL", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "—";
    }
  }

  function elapsed(iso) {
    if (!iso) return "";
    const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 1) return "tani";
    return `${min} min`;
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatEuro(n) {
    return Number(n || 0).toFixed(2) + " €";
  }

  function renderOrderItem(it) {
    const qty = Number(it.quantity) || 1;
    const price = Number(it.price) || 0;
    const lineTotal = price * qty;
    return `<li>
      <span class="qty">${qty}×</span>
      <span class="item-name">${escapeHtml(it.name)}</span>
      <span class="item-price">${formatEuro(price)}${qty > 1 ? `<small> = ${formatEuro(lineTotal)}</small>` : ""}</span>
    </li>`;
  }

  function playNewOrderSound() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.value = 0.001;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.stop(ctx.currentTime + 0.35);
    } catch { /* */ }
  }

  function renderOrders(orders, cancelledOrders) {
    hideError();
    const active = orders || [];
    const cancelled = cancelledOrders || [];
    let hasNew = false;
    for (const o of active) {
      if (!knownIds.has(o.id)) hasNew = true;
    }
    if (hasNew && knownIds.size) playNewOrderSound();
    countEl.textContent = `${active.length} porosi`;
    syncEl.textContent = `Rifreskuar: ${formatTime(new Date().toISOString())}`;

    if (!active.length && !cancelled.length) {
      gridEl.innerHTML = "";
      emptyEl.classList.remove("hidden");
      knownIds = new Set();
      return;
    }

    emptyEl.classList.add("hidden");
    const cancelledHtml = cancelled.map(o => {
      const src = sourceMeta(o);
      const items = (o.items_json || []).map(renderOrderItem).join("");
      return `
        <article class="order-ticket cancelled" data-id="${o.id}">
          <div class="ticket-cancelled-banner">E ANULLUAR ❌</div>
          <div class="ticket-kind">Porosi — jo faturë</div>
          <div class="ticket-source">${src.icon} ${src.label}</div>
          <div class="ticket-head">
            <div class="ticket-table">${escapeHtml(tableLabel(o))}</div>
            <div class="ticket-time">${formatTime(o.ordered_at || o.created_at)}</div>
          </div>
          <div class="ticket-waiter">👤 <strong>${escapeHtml(o.waiter_name || "—")}</strong></div>
          <ul class="ticket-items">${items || "<li>—</li>"}</ul>
        </article>`;
    }).join("");

    gridEl.innerHTML = cancelledHtml + active.map(o => {
      const isNew = !knownIds.has(o.id);
      const src = sourceMeta(o);
      const items = (o.items_json || []).map(renderOrderItem).join("");
      const accepted = !!(o.accepted_at || o.accepted_by_waiter_name);
      const acceptor = String(o.accepted_by_waiter_name || "").trim();
      const acceptLine = accepted
        ? `<div class="ticket-waiter ticket-accepted">✅ Pranuar nga: <strong>${escapeHtml(acceptor || "—")}</strong></div>`
        : `<div class="ticket-waiter ticket-pending">⏳ Në pritje — pranoni me PIN</div>`;
      const actions = accepted
        ? ""
        : `<button type="button" class="btn-ready" data-accept="${o.id}">Prano me PIN 🔐</button>`;
      return `
        <article class="order-ticket${isNew ? " new" : ""}${accepted ? " accepted" : " pending"}" data-id="${o.id}">
          <div class="ticket-kind">Porosi — jo faturë</div>
          <div class="ticket-source">${src.icon} ${src.label}</div>
          <div class="ticket-head">
            <div class="ticket-table">${escapeHtml(tableLabel(o))}</div>
            <div class="ticket-time">${formatTime(o.ordered_at || o.created_at)}<br><small>${elapsed(o.ordered_at || o.created_at)}</small></div>
          </div>
          <div class="ticket-waiter">👤 <strong>${escapeHtml(o.waiter_name || "—")}</strong></div>
          ${acceptLine}
          <ul class="ticket-items">${items || "<li>—</li>"}</ul>
          ${actions}
        </article>`;
    }).join("");

    knownIds = new Set(active.map(o => o.id));
    gridEl.querySelectorAll("[data-accept]").forEach(btn => {
      btn.addEventListener("click", () => acceptOrder(btn.dataset.accept, btn));
    });
  }

  async function fetchOrders() {
    if (!slug) {
      showError("Linku i kuzhinës nuk është i saktë. Duhet /bar/[slug]?key=...");
      return;
    }
    if (!kitchenKey) {
      showError("Mungon kodi i aksesit (?key=...) në link.");
      return;
    }
    try {
      const res = await fetch(`/api/kds/${encodeURIComponent(slug)}/orders${apiQuery()}`, {
        headers: apiHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        showError(data.gabim || "Nuk u ngarkuan porositë.");
        return;
      }
      if (data.restaurant_name || data.client_name) {
        const venue = data.restaurant_name || data.client_name;
        titleEl.textContent = `Banak — ${venue}`;
        subEl.textContent = data.address || "Porosi nga kamarieri dhe tavolina — jo faturë";
        document.title = `Banak — ${venue}`;
        const venueBar = document.getElementById("bar-venue-name");
        if (venueBar) venueBar.textContent = venue;
      }
      renderOrders(data.orders || [], data.cancelled || []);
    } catch (e) {
      showError(e.message || "Gabim rrjeti.");
    }
  }

  function printBarSlip(order, acceptedBy) {
    const src = sourceMeta(order);
    const items = (order.items_json || [])
      .map(it => {
        const qty = Number(it.quantity) || 1;
        const price = Number(it.price) || 0;
        return `<tr><td>${qty}×</td><td>${escapeHtml(it.name)}</td><td style="text-align:right">${formatEuro(price * qty)}</td></tr>`;
      })
      .join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Porosi</title>
<style>
body{font-family:monospace;font-size:14px;max-width:320px;margin:1rem auto}
h1{font-size:16px;text-align:center;margin:0 0 8px}
.meta{margin:4px 0} table{width:100%;border-collapse:collapse} td{padding:2px 0}
hr{border:none;border-top:1px dashed #000;margin:8px 0}
@media print{body{margin:0}}
</style></head><body>
<h1>POROSI — JO FATURË</h1>
<div class="meta">${src.icon} ${src.label}</div>
<div class="meta"><strong>${escapeHtml(tableLabel(order))}</strong></div>
<div class="meta">Klienti: ${escapeHtml(order.waiter_name || "—")}</div>
<div class="meta">Pranuar nga: <strong>${escapeHtml(acceptedBy || "—")}</strong></div>
<div class="meta">${formatTime(order.ordered_at || order.created_at)}</div>
<hr>
<table>${items || "<tr><td>—</td></tr>"}</table>
<hr>
<div class="meta" style="text-align:right"><strong>${formatEuro(order.total)}</strong></div>
<script>window.onload=function(){window.print();setTimeout(function(){window.close()},400)}<\/script>
</body></html>`;
    const w = window.open("", "_blank", "width=400,height=640");
    if (!w) {
      alert("Lejoni dritaret popup për printim.");
      return;
    }
    w.document.write(html);
    w.document.close();
  }

  async function acceptOrder(orderId, btn) {
    const pin = prompt("PIN i kamarierit që e pranon porosinë (4 shifra):");
    if (!pin) return;
    const pinTrim = String(pin).trim();
    if (!/^\d{4}$/.test(pinTrim)) {
      alert("PIN duhet të jetë 4 shifra.");
      return;
    }
    btn.disabled = true;
    btn.textContent = "Duke u përpunuar...";
    try {
      const res = await fetch(
        `/api/kds/${encodeURIComponent(slug)}/orders/${encodeURIComponent(orderId)}/accept${apiQuery()}`,
        {
          method: "POST",
          headers: { ...apiHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ pin: pinTrim }),
        },
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.gabim || "Nuk u pranua porosia.");
        btn.disabled = false;
        btn.textContent = "Prano me PIN 🔐";
        return;
      }
      const acceptedBy = data.accepted_by || "";
      if (data.order) printBarSlip(data.order, acceptedBy);
      if (acceptedBy) alert(`Porosia u pranua nga ${acceptedBy} — fletë porosie u printua.`);
      await refreshAll();
    } catch (e) {
      alert(e.message || "Gabim.");
      btn.disabled = false;
      btn.textContent = "Prano me PIN 🔐";
    }
  }

  function connectSse() {
    if (!slug || !kitchenKey || typeof EventSource === "undefined") return;
    const url = `/api/kds/${encodeURIComponent(slug)}/events?key=${encodeURIComponent(kitchenKey)}`;
    eventSource = new EventSource(url);
    eventSource.addEventListener("kitchen", () => refreshAll());
    eventSource.onerror = () => {
      if (eventSource) eventSource.close();
      setTimeout(connectSse, 5000);
    };
  }

  refreshAll();
  connectSse();
  setInterval(refreshAll, 5000);
})();
