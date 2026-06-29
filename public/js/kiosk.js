(function () {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const params = new URLSearchParams(window.location.search);
  const isTableMenu = parts[0] === "menu" && parts.length >= 3;
  const isLegacyKiosk = parts[0] === "kiosk" && parts.length >= 2;

  const slug = isTableMenu ? parts[1] : isLegacyKiosk ? parts[1] : "";
  const tableNumber = isTableMenu
    ? Number(parts[2] || 0)
    : Number(params.get("table") || 0);
  const kitchenKey = isTableMenu ? "" : (params.get("key") || "");
  const apiChannel = isTableMenu ? "menu" : "kiosk";

  let bootstrap = null;
  let cart = [];
  let menuGroupFilter = "pije";
  let groupBarBound = false;
  let pendingCancel = null;
  let cancelCountdownTimer = null;

  const $ = id => document.getElementById(id);

  function syncKioskLayout() {
    const screen = $("screen-order");
    const bar = $("cart-bar");
    if (!screen || !bar) return;
    const h = Math.ceil(bar.getBoundingClientRect().height);
    screen.style.setProperty("--kiosk-cart-height", `${h}px`);
    screen.style.setProperty("--cart-bar-height", `${h}px`);
  }

  function scheduleKioskLayout() {
    requestAnimationFrame(() => {
      syncKioskLayout();
      requestAnimationFrame(syncKioskLayout);
    });
  }

  function showErr(el, msg) {
    if (!msg) {
      el.classList.add("hidden");
      el.textContent = "";
      return;
    }
    el.textContent = msg;
    el.classList.remove("hidden");
  }

  function formatEuro(n) {
    return Number(n).toFixed(2) + " €";
  }

  function escapeAttr(s) {
    return String(s || "").replace(/"/g, "&quot;");
  }

  function escapeHtml(s) {
    return String(s || "").replace(/</g, "&lt;");
  }

  function apiQuery() {
    return kitchenKey ? `?key=${encodeURIComponent(kitchenKey)}` : "";
  }

  async function api(path, opts = {}) {
    const res = await fetch(path, {
      headers: {
        "Content-Type": "application/json",
        ...(kitchenKey ? { "x-kitchen-key": kitchenKey } : {}),
      },
      ...opts,
    });
    let data = {};
    try { data = await res.json(); } catch { /* */ }
    if (!res.ok || data.ok === false) {
      throw new Error(data.gabim || `Gabim HTTP ${res.status}`);
    }
    return data;
  }

  function updateSyncHint() {
    const hint = $("sync-hint");
    if (!hint) return;
    if (bootstrap?.synced_at) {
      hint.textContent = `Menuja u sinkronizua: ${new Date(bootstrap.synced_at).toLocaleString("sq-AL")}. Porosia shkon te banaku — jo faturë.`;
    } else {
      hint.textContent = "Menuja ende nuk është sinkronizuar nga POS ose pronari.";
    }
  }

  function clearPendingCancel() {
    pendingCancel = null;
    if (cancelCountdownTimer) {
      clearInterval(cancelCountdownTimer);
      cancelCountdownTimer = null;
    }
    $("cancel-order-bar")?.classList.add("hidden");
    scheduleKioskLayout();
  }

  function showPendingCancel(tableNum) {
    clearPendingCancel();
    const cancelUntil = Date.now() + 3 * 60 * 1000;
    pendingCancel = { tableNumber: tableNum, cancelUntil };
    const bar = $("cancel-order-bar");
    const msg = $("cancel-order-msg");
    const countdownEl = $("cancel-countdown");
    if (msg) msg.textContent = `Porosia u dërgua te banaku për T${tableNum}!`;
    bar?.classList.remove("hidden");
    scheduleKioskLayout();
    const tick = () => {
      if (!pendingCancel) return;
      const left = Math.max(0, pendingCancel.cancelUntil - Date.now());
      const sec = Math.ceil(left / 1000);
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      if (countdownEl) {
        countdownEl.textContent = `Mund të anulloni edhe ${m}:${String(s).padStart(2, "0")}`;
      }
      if (left <= 0) clearPendingCancel();
      scheduleKioskLayout();
    };
    tick();
    cancelCountdownTimer = setInterval(tick, 1000);
  }

  function apiPath(suffix) {
    return `/api/${apiChannel}/${encodeURIComponent(slug)}${suffix}${apiQuery()}`;
  }

  async function cancelPendingOrder() {
    if (!pendingCancel) return;
    if (!confirm(`Anulloni porosinë për T${pendingCancel.tableNumber}?`)) return;
    const btn = $("btn-cancel-order");
    if (btn) btn.disabled = true;
    try {
      await api(apiPath("/order/cancel"), {
        method: "POST",
        body: JSON.stringify({ table_number: pendingCancel.tableNumber }),
      });
      clearPendingCancel();
      alert("Porosia u anullua");
      renderCart();
    } catch (e) {
      showErr($("order-err"), e.message);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function bindCancelBar() {
    $("btn-cancel-order")?.addEventListener("click", cancelPendingOrder);
  }

  function kitchenPhotoUrl(item) {
    if (!item?.photo_url) return "";
    const url = String(item.photo_url);
    if (/^https?:\/\//i.test(url)) return url;
    return url + apiQuery();
  }

  function bindMenuGroupBar() {
    if (groupBarBound) return;
    groupBarBound = true;
    MenuPosUI.bindGroupBar($("menu-group-bar"), group => {
      menuGroupFilter = group;
      renderMenu();
    }, { defaultGroup: "pije" });
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
        name: item.name,
        price: Number(item.price),
      }, btn),
    });
  }

  async function loadBootstrap() {
    if (!slug) {
      throw new Error("URL i gabuar. Duhet /menu/[slug]/[nr-tavoline] ose /kiosk/[slug]?key=...&table=5");
    }
    if (!isTableMenu && !kitchenKey) {
      throw new Error("Mungon kodi i aksesit (?key=...) në link.");
    }
    if (!tableNumber || tableNumber < 1) {
      throw new Error(isTableMenu
        ? "Numri i tavolinës në URL është i pavlefshëm."
        : "Mungon numri i tavolinës (?table=5).");
    }

    bootstrap = await api(apiPath("/menu"));
    const venue = bootstrap.restaurant_name || "Porosi tavoline";
    $("kiosk-title").textContent = venue;
    $("kiosk-table-label").textContent = `T${tableNumber}`;
    const venueBar = $("kiosk-venue-name");
    if (venueBar) venueBar.textContent = venue;
    document.title = `${venue} — T${tableNumber}`;

    menuGroupFilter = "pije";
    updateSyncHint();
    bindMenuGroupBar();
    renderMenu();
    renderCart();
  }

  function addToCart(item, btnEl) {
    const existing = cart.find(c => c.name === item.name);
    if (existing) existing.quantity += 1;
    else cart.push({ ...item, quantity: 1 });
    if (btnEl) MenuPosUI.flashButton(btnEl);
    renderCart();
  }

  function renderCart() {
    const lines = $("cart-lines");
    if (!cart.length) {
      lines.innerHTML = '<p class="hint" style="margin:0">Zgjidhni artikuj nga menuja</p>';
    } else {
      lines.innerHTML = cart.map((it, idx) => `
        <div class="cart-line">
          <span>${it.quantity}× ${escapeHtml(it.name)} <small class="cart-unit-price">${formatEuro(it.price)}</small></span>
          <span class="cart-line-total">${formatEuro(it.price * it.quantity)}</span>
          <span class="cart-line-actions">
            <button type="button" class="btn btn-ghost" style="padding:0.2rem 0.4rem;margin-right:0.25rem" data-minus="${idx}">−</button>
            <button type="button" class="btn btn-ghost" style="padding:0.2rem 0.4rem" data-plus="${idx}">+</button>
          </span>
        </div>`).join("");
      lines.querySelectorAll("[data-minus]").forEach(b => {
        b.addEventListener("click", () => {
          const i = Number(b.dataset.minus);
          cart[i].quantity -= 1;
          if (cart[i].quantity <= 0) cart.splice(i, 1);
          renderCart();
        });
      });
      lines.querySelectorAll("[data-plus]").forEach(b => {
        b.addEventListener("click", () => {
          cart[Number(b.dataset.plus)].quantity += 1;
          renderCart();
        });
      });
    }
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    $("cart-total").textContent = formatEuro(total);
    scheduleKioskLayout();
  }

  $("btn-send").addEventListener("click", async () => {
    const err = $("order-err");
    showErr(err, "");
    if (!cart.length) {
      showErr(err, "Shtoni të paktën një artikull.");
      return;
    }
    const btn = $("btn-send");
    btn.disabled = true;
    btn.textContent = "Duke dërguar...";
    try {
      await api(apiPath("/order"), {
        method: "POST",
        body: JSON.stringify({
          table_number: tableNumber,
          items: cart.map(c => ({
            name: c.name,
            quantity: c.quantity,
            price: c.price,
          })),
        }),
      });
      cart = [];
      renderCart();
      showPendingCancel(tableNumber);
    } catch (e) {
      showErr(err, e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Dërgo porosinë te banaku";
    }
  });

  async function refreshMenu() {
    if (!bootstrap) return;
    try {
      const data = await api(apiPath("/menu"));
      bootstrap.synced_at = data.synced_at;
      bootstrap.menu = data.menu;
      bootstrap.categories = data.categories;
      updateSyncHint();
      renderMenu();
    } catch { /* ignore */ }
  }

  loadBootstrap().catch(e => showErr($("order-err"), e.message));
  bindCancelBar();
  window.addEventListener("resize", scheduleKioskLayout);
  window.addEventListener("orientationchange", scheduleKioskLayout);
  setInterval(refreshMenu, 15000);
})();
