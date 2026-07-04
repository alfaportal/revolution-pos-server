(function () {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const slug = parts[0] === "bar" ? parts[1] : "";
  const kitchenKey = new URLSearchParams(window.location.search).get("key") || "";

  const titleEl = document.getElementById("bar-title");
  const subEl = document.getElementById("bar-sub");
  const headerEl = document.querySelector(".bar-header");
  const gridEl = document.getElementById("orders-grid");
  const emptyEl = document.getElementById("empty-state");
  const errorEl = document.getElementById("error-box");
  const countEl = document.getElementById("order-count");
  const syncEl = document.getElementById("last-sync");
  const tablesGridEl = document.getElementById("bar-tables-grid");
  const tablesUpdatedEl = document.getElementById("bar-tables-updated");
  const toastEl = document.getElementById("order-toast");

  let knownIds = new Set();
  let eventSource = null;
  let alarmTimer = null;
  let toastTimer = null;

  function apiQuery() {
    return kitchenKey ? `?key=${encodeURIComponent(kitchenKey)}` : "";
  }

  function apiHeaders() {
    return kitchenKey ? { "x-kitchen-key": kitchenKey } : {};
  }

  function showToast(msg, kind = "info") {
    if (!toastEl || !msg) return;
    toastEl.textContent = msg;
    toastEl.className = `order-toast ${kind}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.className = "order-toast hidden";
      toastEl.textContent = "";
    }, kind === "error" ? 5000 : 3500);
  }

  function showError(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.classList.remove("hidden");
    if (gridEl) gridEl.innerHTML = "";
    emptyEl?.classList.add("hidden");
  }

  function hideError() {
    errorEl?.classList.add("hidden");
  }

  function isPendingOrder(o) {
    return !(o.accepted_at || o.accepted_by_waiter_name);
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

  function applyVenueName(venue) {
    if (!venue) return;
    titleEl.textContent = `Banak — ${venue}`;
    document.title = `Banak — ${venue}`;
    const venueBar = document.getElementById("bar-venue-name");
    if (venueBar) venueBar.textContent = venue;
  }

  async function fetchLiveTables() {
    if (!slug) {
      showError("Linku i banakut nuk është i saktë. Duhet /bar/[slug]?key=...");
      return;
    }
    if (!kitchenKey) {
      showError("Mungon kodi i aksesit (?key=...) në link.");
      return;
    }
    if (!tablesGridEl) return;
    try {
      const res = await fetch(`/api/kds/${encodeURIComponent(slug)}/bar/tables/live${apiQuery()}`, {
        headers: apiHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) return;
      hideError();
      applyVenueName(data.restaurant_name || data.client_name);
      const tables = data.tables || [];
      tablesGridEl.innerHTML = tables.length
        ? tables.map(renderLiveTableCard).join("")
        : '<p class="bar-tables-hint">Nuk ka tavolina të konfiguruara.</p>';
      const stamp = formatTime(data.updated_at || new Date().toISOString());
      if (tablesUpdatedEl) tablesUpdatedEl.textContent = `Përditësuar: ${stamp}`;
      if (syncEl) syncEl.textContent = `Rifreskuar: ${stamp}`;
    } catch {
      /* ignore */
    }
  }

  function playNewOrderSound() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const playBeep = (freq, start, dur) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.value = 0.001;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        gain.gain.exponentialRampToValueAtTime(0.22, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.stop(start + dur);
      };
      playBeep(880, ctx.currentTime, 0.18);
      playBeep(1100, ctx.currentTime + 0.22, 0.22);
    } catch { /* */ }
  }

  function updateAlarmState(orders) {
    const pending = (orders || []).filter(isPendingOrder);
    const active = pending.length > 0;
    headerEl?.classList.toggle("alarm-pulse", active);
    if (active && !alarmTimer) {
      alarmTimer = setInterval(() => playNewOrderSound(), 12000);
    } else if (!active && alarmTimer) {
      clearInterval(alarmTimer);
      alarmTimer = null;
    }
    const n = pending.length;
    if (countEl) {
      countEl.textContent = n === 0
        ? "0 porosi"
        : (n === 1 ? "1 porosi në pritje" : `${n} porosi në pritje`);
    }
  }

  function renderOrders(orders, cancelledOrders) {
    hideError();
    const active = orders || [];
    const pending = active.filter(isPendingOrder);
    const cancelled = cancelledOrders || [];
    let hasNew = false;
    for (const o of pending) {
      if (!knownIds.has(o.id)) hasNew = true;
    }
    if (hasNew && knownIds.size) {
      playNewOrderSound();
      showToast("Porosi e re — pranoni me PIN", "info");
    }

    updateAlarmState(active);
    syncEl.textContent = `Rifreskuar: ${formatTime(new Date().toISOString())}`;

    if (!pending.length && !cancelled.length) {
      gridEl.innerHTML = "";
      emptyEl?.classList.remove("hidden");
      knownIds = new Set();
      return;
    }

    emptyEl?.classList.add("hidden");
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

    gridEl.innerHTML = cancelledHtml + pending.map(o => {
      const isNew = !knownIds.has(o.id);
      const src = sourceMeta(o);
      const items = (o.items_json || []).map(renderOrderItem).join("");
      return `
        <article class="order-ticket${isNew ? " new" : ""} pending" data-id="${o.id}">
          <div class="ticket-kind">Porosi — jo faturë</div>
          <div class="ticket-source">${src.icon} ${src.label}</div>
          <div class="ticket-head">
            <div class="ticket-table">${escapeHtml(tableLabel(o))}</div>
            <div class="ticket-time">${formatTime(o.ordered_at || o.created_at)}<br><small>${elapsed(o.ordered_at || o.created_at)}</small></div>
          </div>
          <div class="ticket-waiter">👤 <strong>${escapeHtml(o.waiter_name || "—")}</strong></div>
          <div class="ticket-waiter ticket-pending">⏳ Në pritje — pranoni me PIN</div>
          <ul class="ticket-items">${items || "<li>—</li>"}</ul>
          <button type="button" class="btn-ready btn-accept" data-accept="${o.id}">Prano me PIN 🔐</button>
        </article>`;
    }).join("");

    knownIds = new Set(pending.map(o => o.id));
    gridEl.querySelectorAll("[data-accept]").forEach(btn => {
      btn.addEventListener("click", () => acceptOrder(btn.dataset.accept, btn));
    });
  }

  function dismissOrderCard(orderId) {
    const card = gridEl?.querySelector(`.order-ticket[data-id="${CSS.escape(String(orderId))}"]`);
    if (!card) return;
    card.classList.add("bar-ticket-leaving");
    setTimeout(() => {
      card.remove();
      knownIds.delete(String(orderId));
      const hasCards = gridEl?.querySelector(".order-ticket");
      if (!hasCards) emptyEl?.classList.remove("hidden");
      updateAlarmState([]);
      if (countEl) countEl.textContent = "0 porosi";
    }, 1500);
  }

  async function fetchOrders() {
    if (!slug) {
      showError("Linku i banakut nuk është i saktë. Duhet /bar/[slug]?key=...");
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
        subEl.textContent = "Porosi nga kamarieri dhe tavolina — jo faturë";
        document.title = `Banak — ${venue}`;
        const venueBar = document.getElementById("bar-venue-name");
        if (venueBar) venueBar.textContent = venue;
      }
      renderOrders(data.orders || [], data.cancelled || []);
    } catch (e) {
      showError(e.message || "Gabim rrjeti.");
    }
  }

  async function acceptOrder(orderId, btn) {
    const pinTrim = await OrderPinModal.request({
      title: "Prano porosinë",
      hint: "Shkruani PIN-in 4-shifror të kamarierit që e pranon porosinë",
    });
    if (!pinTrim) return;
    if (!/^\d{4}$/.test(String(pinTrim).trim())) {
      showToast("PIN duhet të jetë 4 shifra.", "error");
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
          body: JSON.stringify({ pin: String(pinTrim).trim() }),
        },
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        showToast(data.gabim || "Nuk u pranua porosia.", "error");
        btn.disabled = false;
        btn.textContent = "Prano me PIN 🔐";
        return;
      }
      const acceptedBy = data.accepted_by || "";
      showToast(acceptedBy ? `Porosia u pranua nga ${acceptedBy}` : "Porosia u pranua.", "success");
      dismissOrderCard(orderId);
      setTimeout(() => refreshAll(), 1600);
    } catch (e) {
      showToast(e.message || "Gabim.", "error");
      btn.disabled = false;
      btn.textContent = "Prano me PIN 🔐";
    }
  }

  async function refreshAll() {
    await fetchLiveTables();
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
