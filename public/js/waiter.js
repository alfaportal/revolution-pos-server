(function () {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const slug = parts[0] === "waiter" ? parts[1] : "";
  const urlParams = new URLSearchParams(window.location.search);
  const kitchenKey = urlParams.get("key") || "";
  const returnUrl = urlParams.get("return") || "";
  const kasaSession = urlParams.get("kasa_session") || "";
  const WAITER_IDLE_MS = 10000;

  function apiQuery() {
    return kitchenKey ? `?key=${encodeURIComponent(kitchenKey)}` : "";
  }

  function apiHeaders(extra = {}) {
    return {
      "Content-Type": "application/json",
      ...(kitchenKey ? { "x-kitchen-key": kitchenKey } : {}),
      ...extra,
    };
  }

  let bootstrap = null;
  /** @type {{ id: string, name: string } | null} */
  let activeWaiter = null;
  let tableNumber = 0;
  let cart = [];
  let menuGroupFilter = "pije";
  let pinDigits = [];
  let successToastTimer = null;
  let pendingCancel = null;
  let cancelCountdownTimer = null;
  let cartLinesBound = false;
  let groupBarBound = false;
  let idleTimer = null;

  const $ = id => document.getElementById(id);

  function waiterPayload() {
    if (!activeWaiter?.id) throw new Error("Sesioni i kamarierit ka skaduar. Shkruani PIN-in.");
    return {
      waiter_id: activeWaiter.id,
      waiter_name: activeWaiter.name,
    };
  }

  function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    $(id).classList.add("active");
  }

  function showErr(el, msg) {
    if (!el) return;
    if (!msg) {
      el.classList.add("hidden");
      el.textContent = "";
      return;
    }
    el.textContent = msg;
    el.classList.remove("hidden");
    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function formatEuro(n) {
    return Number(n).toFixed(2) + " €";
  }

  async function api(path, opts = {}) {
    const res = await fetch(path, {
      headers: apiHeaders(opts.headers || {}),
      ...opts,
    });
    let data = {};
    try { data = await res.json(); } catch { /* */ }
    if (!res.ok || data.ok === false) {
      throw new Error(data.gabim || `Gabim HTTP ${res.status}`);
    }
    return data;
  }

  function renderPinDisplay() {
    const el = $("pin-display");
    if (!el) return;
    if (!pinDigits.length) {
      el.textContent = "••••";
      return;
    }
    el.textContent = pinDigits.map(() => "●").join(" ") + " ".repeat(Math.max(0, 3 - pinDigits.length) * 2);
  }

  function clearPin() {
    pinDigits = [];
    renderPinDisplay();
    showErr($("login-err"), "");
  }

  function appendPin(digit) {
    if (pinDigits.length >= 4) return;
    pinDigits.push(String(digit));
    renderPinDisplay();
    if (pinDigits.length === 4) {
      submitPinLogin();
    }
  }

  function backspacePin() {
    pinDigits.pop();
    renderPinDisplay();
  }

  function applyBranding(data) {
    const venue = data.restaurant_name || data.client_name || "Kamarieri";
    const location = data.address || data.client_name || "";

    const venueNameEl = $("login-venue-name");
    if (venueNameEl) venueNameEl.textContent = venue;

    const venueSubEl = $("login-venue-sub");
    if (venueSubEl) venueSubEl.textContent = location || "Kamarier — hyrje me PIN";

    const venueLogo = $("venue-logo");
    if (venueLogo) {
      if (data.logo_url) {
        venueLogo.src = data.logo_url;
        venueLogo.classList.remove("hidden");
      } else {
        venueLogo.classList.add("hidden");
        venueLogo.removeAttribute("src");
      }
    }

    $("tables-title").textContent = venue;
    document.title = `Kamarieri — ${venue}`;

    const barVenue = $("bar-venue-name");
    if (barVenue) barVenue.textContent = venue;
    const orderBarVenue = $("order-bar-venue");
    if (orderBarVenue) orderBarVenue.textContent = venue;
  }

  async function loadBootstrap() {
    if (!slug) throw new Error("URL i gabuar. Duhet /waiter/[slug]?key=...");
    if (!kitchenKey) throw new Error("Mungon kodi i aksesit (?key=...) në link.");
    bootstrap = await api(`/api/waiter/${encodeURIComponent(slug)}/bootstrap${apiQuery()}`);
    applyBranding(bootstrap);
    const hint = $("sync-hint");
    const parts = [];
    if (bootstrap.waiter_count != null) {
      parts.push(`${bootstrap.waiter_count} kamarierë me PIN`);
    }
    if (bootstrap.synced_at) {
      parts.push(`Menuja: ${new Date(bootstrap.synced_at).toLocaleString("sq-AL")}`);
    }
    hint.textContent = parts.length
      ? parts.join(" · ")
      : "Pronari shton kamarierët te paneli → Kamarierët.";
  }

  function escapeAttr(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function sameWaiterId(a, b) {
    if (!a || !b) return false;
    return String(a).toLowerCase() === String(b).toLowerCase();
  }

  function showOrderMsg(msg, ok) {
    const el = $("cart-msg");
    if (!el) return;
    if (!msg) {
      el.textContent = "";
      el.className = "cart-msg hidden";
      return;
    }
    el.textContent = msg;
    el.className = "cart-msg " + (ok ? "ok" : "err");
  }

  function clearPendingCancel() {
    pendingCancel = null;
    if (cancelCountdownTimer) {
      clearInterval(cancelCountdownTimer);
      cancelCountdownTimer = null;
    }
    $("btn-cancel-order")?.classList.add("hidden");
    $("cancel-countdown")?.classList.add("hidden");
  }

  function showSuccessToast(msg, { tableNumber = 0, allowCancel = false } = {}) {
    const el = $("success-toast");
    const msgEl = $("success-toast-msg");
    const cancelBtn = $("btn-cancel-order");
    const countdownEl = $("cancel-countdown");
    if (!el || !msgEl) return;
    if (successToastTimer) clearTimeout(successToastTimer);
    clearPendingCancel();
    msgEl.textContent = msg;
    el.classList.remove("hidden");

    if (allowCancel && tableNumber > 0) {
      const cancelUntil = Date.now() + 3 * 60 * 1000;
      pendingCancel = { tableNumber, cancelUntil };
      cancelBtn?.classList.remove("hidden");
      countdownEl?.classList.remove("hidden");
      const tick = () => {
        const left = Math.max(0, pendingCancel.cancelUntil - Date.now());
        const sec = Math.ceil(left / 1000);
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        if (countdownEl) {
          countdownEl.textContent = `Mund të anulloni edhe ${m}:${String(s).padStart(2, "0")}`;
        }
        if (left <= 0) {
          clearPendingCancel();
          el.classList.add("hidden");
        }
      };
      tick();
      cancelCountdownTimer = setInterval(tick, 1000);
      successToastTimer = setTimeout(() => {
        clearPendingCancel();
        el.classList.add("hidden");
      }, 3 * 60 * 1000);
    } else {
      successToastTimer = setTimeout(() => {
        el.classList.add("hidden");
        msgEl.textContent = "";
      }, 4500);
    }
  }

  async function cancelPendingOrder() {
    if (!pendingCancel || !activeWaiter) return;
    if (!confirm(`Anulloni porosinë për T${pendingCancel.tableNumber}?`)) return;
    const btn = $("btn-cancel-order");
    if (btn) btn.disabled = true;
    try {
      await api(`/api/waiter/${encodeURIComponent(slug)}/orders/cancel${apiQuery()}`, {
        method: "POST",
        body: JSON.stringify({
          ...waiterPayload(),
          table_number: pendingCancel.tableNumber,
        }),
      });
      clearPendingCancel();
      $("success-toast")?.classList.add("hidden");
      showSuccessToast("Porosia u anullua");
      await refreshBootstrap();
    } catch (e) {
      alert(e.message || "Anullimi dështoi.");
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  /** Reliable tap/click for mobile — one action per gesture, works with touch. */
  function bindTap(el, handler, { preventTouchScroll = false } = {}) {
    if (!el || el.dataset.tapBound) return;
    el.dataset.tapBound = "1";
    let lastFire = 0;
    const fire = (e, sourceEl) => {
      const now = Date.now();
      if (now - lastFire < 280) return;
      lastFire = now;
      return handler(e, sourceEl);
    };
    el.addEventListener("click", e => fire(e, e.target));
    el.addEventListener("touchend", e => {
      const touch = e.changedTouches?.[0];
      const target = touch
        ? document.elementFromPoint(touch.clientX, touch.clientY)
        : e.target;
      if (!target || !el.contains(target)) return;
      const handled = fire(e, target);
      if (preventTouchScroll && handled !== false) e.preventDefault();
    }, { passive: false });
  }

  function syncCartBarLayout() {
    const screen = $("screen-order");
    const bar = $("cart-bar");
    if (!screen || !bar) return;
    const hasItems = cart.length > 0;
    screen.classList.toggle("has-cart", hasItems);
    bar.classList.toggle("hidden", !hasItems);
    if (hasItems) {
      const h = Math.ceil(bar.getBoundingClientRect().height);
      screen.style.setProperty("--cart-bar-height", `${h}px`);
    } else {
      screen.style.removeProperty("--cart-bar-height");
    }
  }

  function escapeHtml(s) {
    return String(s || "").replace(/</g, "&lt;");
  }

  function renderTableCard(t) {
    return `
      <button type="button" class="table-card ${t.status}" data-table="${t.number}">
        <div class="num">T${t.number}</div>
        <div class="meta">${t.status === "occupied"
          ? `${escapeHtml(t.waiter_name || "E zënë")}<br>${formatEuro(t.order_total || 0)}`
          : "E lirë"}</div>
      </button>`;
  }

  function bindTableCards(root) {
    (root || $("tables-grid")).querySelectorAll("[data-table]").forEach(btn => {
      bindTap(btn, () => openOrder(Number(btn.dataset.table)));
    });
  }

  function kitchenPhotoUrl(item) {
    if (!item?.photo_url) return "";
    const url = String(item.photo_url);
    if (/^https?:\/\//i.test(url)) return url;
    return url + apiQuery();
  }

  function clearIdleTimer() {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  }

  function scheduleIdleLock() {
    clearIdleTimer();
    if (!activeWaiter) return;
    idleTimer = setTimeout(() => lockSession(), WAITER_IDLE_MS);
  }

  function setupWaiterIdleLock() {
    function onActivity() {
      if (activeWaiter) scheduleIdleLock();
    }
    ["pointerdown", "touchstart", "keydown"].forEach(ev => {
      document.addEventListener(ev, onActivity, { passive: true, capture: true });
    });
    window.resetWaiterIdleLock = scheduleIdleLock;
  }

  function setupDesktopReturn() {
    const btn = $("btn-back-desktop");
    if (!btn) return;
    if (returnUrl && /^https?:\/\//i.test(returnUrl)) {
      btn.classList.remove("hidden");
      btn.addEventListener("click", () => window.location.assign(returnUrl));
    }
  }

  function bindMenuGroupBar() {
    if (groupBarBound) return;
    groupBarBound = true;
    MenuPosUI.bindGroupBar($("menu-group-bar"), group => {
      menuGroupFilter = group;
      renderMenu();
    }, { defaultGroup: "pije" });
  }

  function bindCartLines() {
    const lines = $("cart-lines");
    if (!lines || cartLinesBound) return;
    cartLinesBound = true;
    bindTap(lines, (_e, target) => {
      const minus = target?.closest?.("[data-minus]");
      const plus = target?.closest?.("[data-plus]");
      if (minus) {
        const i = Number(minus.getAttribute("data-minus"));
        if (Number.isNaN(i) || !cart[i]) return;
        cart[i].quantity -= 1;
        if (cart[i].quantity <= 0) cart.splice(i, 1);
        renderCart();
        return;
      }
      if (plus) {
        const i = Number(plus.getAttribute("data-plus"));
        if (Number.isNaN(i) || !cart[i]) return;
        cart[i].quantity += 1;
        renderCart();
      }
    });
  }

  function renderTables() {
    const grid = $("tables-grid");
    if (!bootstrap?.tables?.length) {
      grid.innerHTML = '<p class="hint">Nuk ka tavolina. Pronari shton hapësira te Lokal &amp; Stafi në panel.</p>';
      return;
    }
    const areas = bootstrap.areas?.filter(a => a.tables?.length) || [];
    if (areas.length > 1) {
      grid.innerHTML = areas.map(area => `
        <section class="waiter-area-block">
          <h2 class="waiter-area-title">${escapeHtml(area.name)}</h2>
          <div class="tables-grid-area">${area.tables.map(renderTableCard).join("")}</div>
        </section>`).join("");
    } else {
      grid.innerHTML = bootstrap.tables.map(renderTableCard).join("");
    }
    bindTableCards(grid);
  }

  function renderMenu() {
    const menu = bootstrap?.menu || [];
    const grid = $("menu-grid");
    if (!grid) return;
    if (!menu.length) {
      grid.innerHTML = '<p class="hint">Menuja është bosh. Pronari shton artikuj te Menuja në panel, ose sinkronizoni menuën nga POS-i lokal.</p>';
      return;
    }
    MenuPosUI.renderMenuGrid({
      container: grid,
      menuItems: menu,
      groupFilter: menuGroupFilter,
      formatEuro,
      getPhotoUrl: kitchenPhotoUrl,
      onSelectItem: (item, btn) => addToCart({
        id: item.id,
        name: item.name,
        price: Number(item.price),
      }, btn),
    });
  }

  function enterWaiterSession(waiter) {
    activeWaiter = { id: waiter.id, name: waiter.name };
    $("tables-waiter").textContent = `Kamarieri: ${waiter.name}`;
    renderTables();
    scheduleIdleLock();
    showScreen("screen-tables");
  }

  function lockSession() {
    clearIdleTimer();
    activeWaiter = null;
    tableNumber = 0;
    cart = [];
    clearPin();
    hideReceipt();
    $("cart-badge")?.classList.add("hidden");
    $("cart-bar")?.classList.add("hidden");
    $("screen-order")?.classList.remove("has-cart");
    showScreen("screen-pin");
  }

  async function tryKasaSessionEnter() {
    if (!kasaSession) return false;
    try {
      const data = await api(`/api/waiter/${encodeURIComponent(slug)}/kasa-session${apiQuery()}`, {
        method: "POST",
        body: JSON.stringify({ session_token: kasaSession }),
      });
      stripKasaSessionFromUrl();
      enterWaiterSession(data.waiter);
      return true;
    } catch {
      stripKasaSessionFromUrl();
      return false;
    }
  }

  function stripKasaSessionFromUrl() {
    try {
      const u = new URL(window.location.href);
      u.searchParams.delete("kasa_session");
      window.history.replaceState({}, "", u.pathname + u.search + u.hash);
    } catch {
      /* ignore */
    }
  }

  async function submitPinLogin() {
    const err = $("login-err");
    showErr(err, "");
    if (pinDigits.length !== 4) {
      showErr(err, "PIN duhet të jetë 4 shifra.");
      return;
    }
    const btn = $("btn-pin-login");
    btn.disabled = true;
    try {
      if (!bootstrap) await loadBootstrap();
      const data = await api(`/api/waiter/${encodeURIComponent(slug)}/login${apiQuery()}`, {
        method: "POST",
        body: JSON.stringify({ pin: pinDigits.join("") }),
      });
      clearPin();
      enterWaiterSession(data.waiter);
    } catch (e) {
      clearPin();
      showErr(err, e.message);
    } finally {
      btn.disabled = false;
    }
  }

  function openOrder(num) {
    if (!activeWaiter) {
      lockSession();
      return;
    }
    tableNumber = num;
    const table = bootstrap.tables?.find(t => t.number === num);
    const sameWaiter = table?.waiter_id
      ? sameWaiterId(table.waiter_id, activeWaiter.id)
      : table?.waiter_name?.toLowerCase() === activeWaiter.name.toLowerCase();
    if (table?.active_items?.length && sameWaiter) {
      cart = table.active_items.map(i => ({
        name: i.name,
        price: Number(i.price),
        quantity: Number(i.quantity),
      }));
    } else {
      cart = [];
    }
    menuGroupFilter = "pije";
    document.querySelectorAll("#menu-group-bar .menu-group-btn").forEach(b => {
      b.classList.toggle("active", b.dataset.group === "pije");
    });
    $("order-title").textContent = `T${num}`;
    showOrderMsg("", false);
    renderMenu();
    renderCart();
    showScreen("screen-order");
  }

  function addToCart(item, btnEl) {
    const existing = cart.find(c => c.name === item.name && Number(c.price) === Number(item.price));
    if (existing) existing.quantity += 1;
    else cart.push({ ...item, quantity: 1 });
    if (btnEl) MenuPosUI.flashButton(btnEl);
    renderCart();
  }

  function renderCart() {
    const lines = $("cart-lines");
    const count = cart.reduce((s, i) => s + i.quantity, 0);
    const badge = $("cart-badge");
    const countLabel = $("cart-count-label");

    if (badge) {
      badge.textContent = String(count);
      badge.classList.toggle("hidden", count === 0);
    }
    if (countLabel) {
      countLabel.textContent = count === 1 ? "1 artikull" : `${count} artikuj`;
    }

    if (!cart.length) {
      lines.innerHTML = "";
    } else {
      lines.innerHTML = cart.map((it, idx) => `
        <div class="cart-line">
          <span>${it.quantity}× ${escapeHtml(it.name)} <small class="cart-unit-price">${formatEuro(it.price)}</small></span>
          <span class="cart-line-total">${formatEuro(it.price * it.quantity)}</span>
          <span class="cart-line-actions">
            <button type="button" class="btn btn-ghost cart-qty-btn" data-minus="${idx}">−</button>
            <button type="button" class="btn btn-ghost cart-qty-btn" data-plus="${idx}">+</button>
          </span>
        </div>`).join("");
    }
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    $("cart-total").textContent = formatEuro(total);
    syncCartBarLayout();
    requestAnimationFrame(syncCartBarLayout);
  }

  async function refreshBootstrap() {
    if (!activeWaiter) return;
    try {
      const data = await api(`/api/waiter/${encodeURIComponent(slug)}/bootstrap${apiQuery()}`);
      bootstrap.tables = data.tables;
      bootstrap.areas = data.areas;
      bootstrap.synced_at = data.synced_at;
      bootstrap.menu = data.menu;
      bootstrap.categories = data.categories;
      bootstrap.waiter_count = data.waiter_count;
      const hint = $("sync-hint");
      if (bootstrap.synced_at) {
        hint.textContent = `Menuja u sinkronizua: ${new Date(bootstrap.synced_at).toLocaleString("sq-AL")}`;
      }
      if ($("screen-order").classList.contains("active")) {
        renderMenu();
      }
      renderTables();
    } catch { /* ignore background refresh */ }
  }

  $("pin-keypad")?.querySelectorAll("[data-digit]").forEach(btn => {
    btn.addEventListener("click", () => appendPin(btn.dataset.digit));
  });
  $("pin-clear")?.addEventListener("click", clearPin);
  $("pin-back")?.addEventListener("click", backspacePin);
  $("btn-pin-login")?.addEventListener("click", submitPinLogin);

  $("btn-logout")?.addEventListener("click", lockSession);

  $("btn-back")?.addEventListener("click", () => {
    tableNumber = 0;
    showOrderMsg("", false);
    showScreen("screen-tables");
    refreshBootstrap();
  });

  function renderReceiptFallback(receipt) {
    const mm = receipt.paper_width_mm || 80;
    const biz = receipt.business || {};
    const items = receipt.items || [];
    const narrow = Number(mm) <= 58;
    const fmt = n => Number(n).toFixed(2);
    const printed = receipt.printed_date && receipt.printed_time
      ? `${receipt.printed_date} &nbsp; ${receipt.printed_time}`
      : new Date().toLocaleString("sq-AL");

    const itemRows = items.map(i => {
      const lineTotal = fmt(Number(i.price) * Number(i.quantity));
      if (narrow) {
        return `<tr class="rc-item-row"><td class="rc-name" colspan="4">
          <div class="rc-item-name">${escapeHtml(i.name)}</div>
          <div class="rc-item-sub"><span>${i.quantity} × ${fmt(i.price)}</span><span class="rc-item-line-total">${lineTotal} €</span></div>
        </td></tr>`;
      }
      return `<tr class="rc-item-row">
        <td class="rc-name">${escapeHtml(i.name)}</td>
        <td class="rc-qty">${i.quantity}</td>
        <td class="rc-price">${fmt(i.price)}</td>
        <td class="rc-value">${lineTotal}</td>
      </tr>`;
    }).join("");

    const tableHead = narrow ? "" : `<thead><tr>
      <th class="rc-name">Artikulli</th><th class="rc-qty">Sasi</th>
      <th class="rc-price">Çmim</th><th class="rc-value">Total</th></tr></thead>`;

    return `<div class="receipt-thermal" data-width-mm="${mm}">
      <div class="rc-header">
        <div class="rc-business-name">${escapeHtml(biz.business_name || receipt.restaurant_name || "Faturë")}</div>
        ${biz.address ? `<div class="rc-meta-line">${escapeHtml(biz.address)}</div>` : ""}
        ${biz.phone ? `<div class="rc-meta-line">Tel: ${escapeHtml(biz.phone)}</div>` : ""}
      </div>
      <div class="rc-divider rc-divider-strong"></div>
      <div class="rc-order-meta">
        ${receipt.receipt_number ? `<div><span class="rc-meta-label">Porosia</span> ${escapeHtml(receipt.receipt_number)}</div>` : ""}
        ${receipt.table_number ? `<div><span class="rc-meta-label">Tavolina</span> T${receipt.table_number}</div>` : ""}
        ${receipt.waiter_name ? `<div><span class="rc-meta-label">Kamarieri</span> ${escapeHtml(receipt.waiter_name)}</div>` : ""}
      </div>
      <div class="rc-divider"></div>
      <table class="rc-items${narrow ? " rc-items-narrow" : ""}">${tableHead}<tbody>${itemRows}</tbody></table>
      <div class="rc-divider rc-divider-strong"></div>
      <div class="rc-total"><span class="rc-total-label">GJITHSEJ</span><span class="rc-total-value">${fmt(receipt.total || 0)} €</span></div>
      <div class="rc-divider"></div>
      <div class="rc-footer"><div class="rc-thanks">Faleminderit!</div><div class="rc-printed">${printed}</div></div>
    </div>`;
  }

  function showReceipt(receipt) {
    const sheet = $("receipt-print");
    sheet.innerHTML = receipt.html || renderReceiptFallback(receipt);
    const mm = receipt.paper_width_mm || sheet.querySelector(".receipt-thermal")?.dataset?.widthMm || 80;
    sheet.style.maxWidth = `${mm}mm`;
    $("receipt-modal").classList.remove("hidden");
  }

  function printReceipt() {
    const sheet = $("receipt-print");
    const thermal = sheet?.querySelector(".receipt-thermal");
    const mm = Number(thermal?.dataset?.widthMm || sheet?.style?.maxWidth?.replace("mm", "") || 80);
    const narrow = mm <= 58;
    const prevTitle = document.title;
    const bizName = thermal?.querySelector(".rc-business-name")?.textContent?.trim();

    document.title = bizName || " ";
    document.body.classList.add("print-receipt");
    if (narrow) document.documentElement.classList.add("print-receipt-w58");

    let pageStyle = document.getElementById("receipt-page-size");
    if (!pageStyle) {
      pageStyle = document.createElement("style");
      pageStyle.id = "receipt-page-size";
      document.head.appendChild(pageStyle);
    }
    pageStyle.textContent = `@media print { @page { size: ${narrow ? 58 : 80}mm auto; margin: 0; } }`;

    const cleanup = () => {
      document.body.classList.remove("print-receipt");
      document.documentElement.classList.remove("print-receipt-w58");
      document.title = prevTitle;
      if (pageStyle) pageStyle.textContent = "";
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    requestAnimationFrame(() => window.print());
  }

  function hideReceipt() {
    $("receipt-modal").classList.add("hidden");
  }

  $("btn-print")?.addEventListener("click", printReceipt);

  $("btn-receipt-done")?.addEventListener("click", async () => {
    hideReceipt();
    cart = [];
    renderCart();
    tableNumber = 0;
    await refreshBootstrap();
    showScreen("screen-tables");
  });

  $("btn-close")?.addEventListener("click", async () => {
    const err = $("order-err");
    showErr(err, "");
    const table = bootstrap.tables?.find(t => t.number === tableNumber);
    const hasOrder = cart.length || table?.active_items?.length;
    if (!hasOrder) {
      showErr(err, "Nuk ka artikuj për të mbyllur tavolinën.");
      return;
    }
    if (!confirm(`Mbyll tavolinën T${tableNumber} dhe printo faturën?`)) return;
    const btn = $("btn-close");
    btn.disabled = true;
    btn.textContent = "Duke mbyllur...";
    try {
      const data = await api(`/api/waiter/${encodeURIComponent(slug)}/orders/close${apiQuery()}`, {
        method: "POST",
        body: JSON.stringify({
          ...waiterPayload(),
          table_number: tableNumber,
          items: cart.map(c => ({
            name: c.name,
            quantity: c.quantity,
            price: c.price,
          })),
        }),
      });
      showReceipt(data.receipt);
      setTimeout(printReceipt, 400);
    } catch (e) {
      showErr(err, e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Mbyll tavolinën + Printo faturën";
    }
  });

  async function submitOrder() {
    const btn = $("btn-send");
    if (btn?.disabled) return;

    const err = $("order-err");
    showErr(err, "");
    showOrderMsg("", false);

    if (!activeWaiter?.id) {
      const msg = "Sesioni i kamarierit ka skaduar. Shkruani PIN-in.";
      showErr(err, msg);
      showOrderMsg(msg, false);
      lockSession();
      return;
    }
    if (!tableNumber || tableNumber < 1) {
      const msg = "Zgjidhni tavolinën para se të dërgoni porosinë.";
      showErr(err, msg);
      showOrderMsg(msg, false);
      return;
    }
    if (!cart.length) {
      const msg = "Shtoni të paktën një artikull.";
      showErr(err, msg);
      showOrderMsg(msg, false);
      return;
    }

    if (!btn) return;
    btn.disabled = true;
    btn.textContent = "Duke dërguar...";
    const sentTable = tableNumber;
    let payload;
    try {
      payload = {
        ...waiterPayload(),
        table_number: sentTable,
        items: cart.map(c => ({
          name: c.name,
          quantity: c.quantity,
          price: c.price,
        })),
      };
    } catch (e) {
      showErr(err, e.message);
      showOrderMsg(e.message, false);
      btn.disabled = false;
      btn.textContent = "Dërgo Porosinë";
      return;
    }

    try {
      await api(`/api/waiter/${encodeURIComponent(slug)}/orders${apiQuery()}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      cart = [];
      renderCart();
      const sentMsg = `✅ Porosia u dërgua te banaku për T${sentTable}!`;
      tableNumber = 0;
      await refreshBootstrap();
      showScreen("screen-tables");
      showOrderMsg("", false);
      showSuccessToast(sentMsg, { tableNumber: sentTable, allowCancel: true });
      scheduleIdleLock();
    } catch (e) {
      const msg = e.message || "Porosia nuk u dërgua. Provoni përsëri.";
      showErr(err, msg);
      showOrderMsg(msg, false);
    } finally {
      btn.disabled = false;
      btn.textContent = "Dërgo Porosinë";
    }
  }

  bindMenuGroupBar();
  bindCartLines();
  setupWaiterIdleLock();
  setupDesktopReturn();
  bindTap($("btn-send"), submitOrder);
  $("btn-cancel-order")?.addEventListener("click", cancelPendingOrder);

  (async () => {
    try {
      await loadBootstrap();
      if (await tryKasaSessionEnter()) return;
      renderPinDisplay();
      showScreen("screen-pin");
    } catch (e) {
      showErr($("login-err"), e.message);
    }
  })();

  setInterval(() => {
    if (activeWaiter && ($("screen-tables").classList.contains("active") || $("screen-order").classList.contains("active"))) {
      refreshBootstrap();
    }
  }, 15000);
})();
