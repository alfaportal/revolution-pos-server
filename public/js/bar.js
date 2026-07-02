(function () {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const slug = parts[0] === "bar" ? parts[1] : "";
  const kitchenKey = new URLSearchParams(window.location.search).get("key") || "";

  const titleEl = document.getElementById("bar-title");
  const subEl = document.getElementById("bar-sub");
  const headerEl = document.querySelector(".bar-header");
  const countEl = document.getElementById("order-count");
  const syncEl = document.getElementById("last-sync");
  const tablesGridEl = document.getElementById("bar-tables-grid");
  const tablesUpdatedEl = document.getElementById("bar-tables-updated");
  const toastEl = document.getElementById("order-toast");

  let knownPendingIds = new Set();
  let eventSource = null;
  let alarmTimer = null;
  let toastTimer = null;

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
    await Promise.all([fetchLiveTables(), fetchPendingSignal()]);
  }

  function apiQuery() {
    return kitchenKey ? `?key=${encodeURIComponent(kitchenKey)}` : "";
  }

  function apiHeaders() {
    return kitchenKey ? { "x-kitchen-key": kitchenKey } : {};
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

  function updateAlarmState(pending) {
    const active = (pending || []).length > 0;
    headerEl?.classList.toggle("alarm-pulse", active);
    if (active && !alarmTimer) {
      alarmTimer = setInterval(() => playNewOrderSound(), 12000);
    } else if (!active && alarmTimer) {
      clearInterval(alarmTimer);
      alarmTimer = null;
    }
  }

  function processPendingSignal(orders) {
    const pending = (orders || []).filter(isPendingOrder);
    let hasNew = false;
    for (const o of pending) {
      if (!knownPendingIds.has(o.id)) hasNew = true;
    }
    if (hasNew && knownPendingIds.size) {
      playNewOrderSound();
      showToast("Porosi e re — pranoni te paneli i kamarierit", "info");
    }
    updateAlarmState(pending);
    const n = pending.length;
    countEl.textContent = n === 1 ? "1 porosi në pritje" : `${n} porosi në pritje`;
    syncEl.textContent = `Rifreskuar: ${formatTime(new Date().toISOString())}`;
    knownPendingIds = new Set(pending.map(o => o.id));
  }

  async function fetchPendingSignal() {
    if (!slug) {
      showToast("Linku i banakut nuk është i saktë. Duhet /bar/[slug]?key=...", "error");
      return;
    }
    if (!kitchenKey) {
      showToast("Mungon kodi i aksesit (?key=...) në link.", "error");
      return;
    }
    try {
      const res = await fetch(`/api/kds/${encodeURIComponent(slug)}/orders${apiQuery()}`, {
        headers: apiHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        showToast(data.gabim || "Nuk u ngarkua sinjali i porosive.", "error");
        return;
      }
      if (data.restaurant_name || data.client_name) {
        const venue = data.restaurant_name || data.client_name;
        titleEl.textContent = `Banak — ${venue}`;
        subEl.textContent = "Tavolinat live — sinjal për porosi të reja (pranohen te kamarieri)";
        document.title = `Banak — ${venue}`;
        const venueBar = document.getElementById("bar-venue-name");
        if (venueBar) venueBar.textContent = venue;
      }
      processPendingSignal(data.orders || []);
    } catch (e) {
      showToast(e.message || "Gabim rrjeti.", "error");
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
