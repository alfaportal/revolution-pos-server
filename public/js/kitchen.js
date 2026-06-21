(function () {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const clientId = parts[0] === "kitchen" ? parts[1] : "";

  const titleEl = document.getElementById("kitchen-title");
  const subEl = document.getElementById("kitchen-sub");
  const gridEl = document.getElementById("orders-grid");
  const emptyEl = document.getElementById("empty-state");
  const errorEl = document.getElementById("error-box");
  const countEl = document.getElementById("order-count");
  const syncEl = document.getElementById("last-sync");

  let knownIds = new Set();

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

  function renderOrders(orders) {
    hideError();
    countEl.textContent = `${orders.length} porosi`;
    syncEl.textContent = `Rifreskuar: ${formatTime(new Date().toISOString())}`;

    if (!orders.length) {
      gridEl.innerHTML = "";
      emptyEl.classList.remove("hidden");
      knownIds = new Set();
      return;
    }

    emptyEl.classList.add("hidden");
    const html = orders.map(o => {
      const isNew = !knownIds.has(o.id);
      const items = (o.items_json || [])
        .map(it => `<li><span class="qty">${it.quantity}×</span><span>${escapeHtml(it.name)}</span></li>`)
        .join("");
      return `
        <article class="order-ticket${isNew ? " new" : ""}" data-id="${o.id}">
          <div class="ticket-head">
            <div class="ticket-table">T${o.table_number || "?"}</div>
            <div class="ticket-time">${formatTime(o.ordered_at || o.created_at)}<br><small>${elapsed(o.ordered_at || o.created_at)}</small></div>
          </div>
          <div class="ticket-waiter">👤 ${escapeHtml(o.waiter_name || "—")}</div>
          <ul class="ticket-items">${items || "<li>—</li>"}</ul>
          <button type="button" class="btn-ready" data-ready="${o.id}">Gati ✅</button>
        </article>`;
    }).join("");

    gridEl.innerHTML = html;
    knownIds = new Set(orders.map(o => o.id));

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
    if (!clientId) {
      showError("Linku i kuzhinës nuk është i saktë. Duhet /kitchen/[client_id]");
      return;
    }
    try {
      const res = await fetch(`/api/kds/${encodeURIComponent(clientId)}/orders`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        showError(data.gabim || "Nuk u ngarkuan porositë.");
        return;
      }
      if (data.client_name) {
        titleEl.textContent = data.client_name;
        subEl.textContent = "Porositë e reja nga POS";
        document.title = `Kuzhina — ${data.client_name}`;
      }
      renderOrders(data.orders || []);
    } catch (e) {
      showError(e.message || "Gabim rrjeti.");
    }
  }

  async function markReady(orderId, btn) {
    btn.disabled = true;
    btn.textContent = "Duke u përpunuar...";
    try {
      const res = await fetch(
        `/api/kds/${encodeURIComponent(clientId)}/orders/${encodeURIComponent(orderId)}/ready`,
        { method: "POST" },
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

  fetchOrders();
  setInterval(fetchOrders, 5000);
})();
