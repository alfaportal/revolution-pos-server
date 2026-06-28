(function () {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const slug = parts[0] === "kitchen" ? parts[1] : "";
  const kitchenKey = new URLSearchParams(window.location.search).get("key") || "";

  const titleEl = document.getElementById("kitchen-title");
  const subEl = document.getElementById("kitchen-sub");
  const gridEl = document.getElementById("orders-grid");
  const emptyEl = document.getElementById("empty-state");
  const errorEl = document.getElementById("error-box");
  const countEl = document.getElementById("order-count");
  const syncEl = document.getElementById("last-sync");

  let knownIds = new Set();
  let eventSource = null;

  function apiQuery() {
    return kitchenKey ? `?key=${encodeURIComponent(kitchenKey)}` : "";
  }

  function apiHeaders() {
    return kitchenKey ? { "x-kitchen-key": kitchenKey } : {};
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

  function renderOrders(orders, cancelledOrders) {
    hideError();
    const active = orders || [];
    const cancelled = cancelledOrders || [];
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
      const device = String(o.device_id || "").toUpperCase();
      let src = null;
      let tableText = `T${o.table_number || "?"}`;
      if (device === "WEB-PUBLIC") {
        const w = String(o.waiter_name || "").toLowerCase();
        src = w.startsWith("delivery")
          ? { icon: "🛵", label: "Delivery" }
          : { icon: "🥡", label: "Takeaway" };
        tableText = src.label;
      } else if (device === "WEB-KIOSK") {
        src = { icon: "🪑", label: "Tavolinë" };
      } else if (device === "WEB-WAITER") {
        src = { icon: "📱", label: "Kamarier" };
      }
      const items = (o.items_json || []).map(renderOrderItem).join("");
      return `
        <article class="order-ticket cancelled" data-id="${o.id}">
          <div class="ticket-cancelled-banner">E ANULLUAR ❌</div>
          <div class="ticket-head">
            <div class="ticket-table">${escapeHtml(tableText)}</div>
            <div class="ticket-time">${formatTime(o.ordered_at || o.created_at)}</div>
          </div>
          ${src ? `<div class="ticket-waiter">${src.icon} ${src.label} · 👤 <strong>${escapeHtml(o.waiter_name || "—")}</strong></div>` : `<div class="ticket-waiter">👤 <strong>${escapeHtml(o.waiter_name || "—")}</strong></div>`}
          <ul class="ticket-items">${items || "<li>—</li>"}</ul>
        </article>`;
    }).join("");

    const activeHtml = active.map(o => {
      const isNew = !knownIds.has(o.id);
      const device = String(o.device_id || "").toUpperCase();
      let src = null;
      let tableText = `T${o.table_number || "?"}`;
      if (device === "WEB-PUBLIC") {
        const w = String(o.waiter_name || "").toLowerCase();
        src = w.startsWith("delivery")
          ? { icon: "🛵", label: "Delivery" }
          : { icon: "🥡", label: "Takeaway" };
        tableText = src.label;
      } else if (device === "WEB-KIOSK") {
        src = { icon: "🪑", label: "Tavolinë" };
      } else if (device === "WEB-WAITER") {
        src = { icon: "📱", label: "Kamarier" };
      }
      const items = (o.items_json || []).map(renderOrderItem).join("");
      return `
        <article class="order-ticket${isNew ? " new" : ""}" data-id="${o.id}">
          <div class="ticket-head">
            <div class="ticket-table">${escapeHtml(tableText)}</div>
            <div class="ticket-time">${formatTime(o.ordered_at || o.created_at)}<br><small>${elapsed(o.ordered_at || o.created_at)}</small></div>
          </div>
          ${src ? `<div class="ticket-waiter">${src.icon} ${src.label} · 👤 <strong>${escapeHtml(o.waiter_name || "—")}</strong></div>` : `<div class="ticket-waiter">👤 <strong>${escapeHtml(o.waiter_name || "—")}</strong></div>`}
          <ul class="ticket-items">${items || "<li>—</li>"}</ul>
          <button type="button" class="btn-ready" data-ready="${o.id}">Gati ✅</button>
        </article>`;
    }).join("");

    gridEl.innerHTML = cancelledHtml + activeHtml;
    knownIds = new Set(active.map(o => o.id));

    gridEl.querySelectorAll("[data-ready]").forEach(btn => {
      btn.addEventListener("click", () => markReady(btn.dataset.ready, btn));
    });
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function fetchOrders() {
    if (!slug) {
      showError("Linku i kuzhinës nuk është i saktë. Duhet /kitchen/[slug]?key=...");
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
        titleEl.textContent = venue;
        document.title = `Kuzhina — ${venue}`;
        const venueBar = document.getElementById("kitchen-venue-name");
        if (venueBar) venueBar.textContent = venue;
      }
      const barLink = document.getElementById("kitchen-bar-link");
      if (barLink && slug && kitchenKey) {
        barLink.href = `/bar/${encodeURIComponent(slug)}?key=${encodeURIComponent(kitchenKey)}`;
      }
      if (subEl) {
        subEl.innerHTML = "Ushqim nga POS — porositë e tavolinës (QR/kamarier/online) shkojnë te <a href=\"" +
          (barLink?.href || "#") + "\" style=\"color:#93c5fd;font-weight:700\">Banak</a>";
      }
      renderOrders(data.orders || [], data.cancelled || []);
    } catch (e) {
      showError(e.message || "Gabim rrjeti.");
    }
  }

  async function markReady(orderId, btn) {
    btn.disabled = true;
    btn.textContent = "Duke u përpunuar...";
    try {
      const res = await fetch(
        `/api/kds/${encodeURIComponent(slug)}/orders/${encodeURIComponent(orderId)}/ready${apiQuery()}`,
        { method: "POST", headers: apiHeaders() },
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.gabim || "Nuk u shënua si gati.");
        btn.disabled = false;
        btn.textContent = "Gati ✅";
        return;
      }
      const card = gridEl.querySelector(`[data-id="${orderId}"]`);
      if (card) card.remove();
      knownIds.delete(orderId);
      const remaining = gridEl.querySelectorAll(".order-ticket").length;
      countEl.textContent = `${remaining} porosi`;
      if (!remaining) emptyEl.classList.remove("hidden");
    } catch (e) {
      alert(e.message || "Gabim.");
      btn.disabled = false;
      btn.textContent = "Gati ✅";
    }
  }

  function connectSse() {
    if (!slug || !kitchenKey || typeof EventSource === "undefined") return;
    const url = `/api/kds/${encodeURIComponent(slug)}/events?key=${encodeURIComponent(kitchenKey)}`;
    eventSource = new EventSource(url);
    eventSource.addEventListener("kitchen", () => fetchOrders());
    eventSource.onerror = () => {
      if (eventSource) eventSource.close();
      setTimeout(connectSse, 5000);
    };
  }

  fetchOrders();
  connectSse();
  setInterval(fetchOrders, 30000);
})();
