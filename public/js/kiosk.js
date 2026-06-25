(function () {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const slug = parts[0] === "kiosk" ? parts[1] : "";
  const params = new URLSearchParams(window.location.search);
  const kitchenKey = params.get("key") || "";
  const tableNumber = Number(params.get("table") || 0);

  let bootstrap = null;
  let cart = [];
  let activeCategory = "";

  const $ = id => document.getElementById(id);

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

  async function loadBootstrap() {
    if (!slug) throw new Error("URL i gabuar. Duhet /kiosk/[slug]?key=...&table=5");
    if (!kitchenKey) throw new Error("Mungon kodi i aksesit (?key=...) në link.");
    if (!tableNumber || tableNumber < 1) throw new Error("Mungon numri i tavolinës (?table=5).");

    bootstrap = await api(`/api/kiosk/${encodeURIComponent(slug)}/menu${apiQuery()}`);
    $("kiosk-title").textContent = bootstrap.restaurant_name || "Porosi tavoline";
    $("kiosk-table-label").textContent = `T${tableNumber}`;
    document.title = `${bootstrap.restaurant_name || "Tavolinë"} — T${tableNumber}`;

    const hint = $("sync-hint");
    if (bootstrap.synced_at) {
      hint.textContent = `Menuja u sinkronizua: ${new Date(bootstrap.synced_at).toLocaleString("sq-AL")}. Porosia shkon te banaku — jo faturë.`;
    }

    activeCategory = bootstrap.categories?.[0] || "";
    renderCategories();
    renderMenu();
    renderCart();
  }

  function renderCategories() {
    const cats = bootstrap.categories?.length
      ? bootstrap.categories
      : [...new Set((bootstrap.menu || []).map(m => m.category))];
    const tabs = $("cat-tabs");
    tabs.innerHTML = cats.map(c => `
      <button type="button" class="cat-tab${c === activeCategory ? " active" : ""}" data-cat="${escapeAttr(c)}">${escapeHtml(c)}</button>
    `).join("");
    tabs.querySelectorAll(".cat-tab").forEach(btn => {
      btn.addEventListener("click", () => {
        activeCategory = btn.dataset.cat;
        renderCategories();
        renderMenu();
      });
    });
  }

  function renderMenu() {
    const items = (bootstrap.menu || []).filter(m => !activeCategory || m.category === activeCategory);
    const grid = $("menu-grid");
    if (!items.length) {
      grid.innerHTML = '<p class="hint">Nuk ka artikuj. Sinkronizoni menuën nga POS.</p>';
      return;
    }
    grid.innerHTML = items.map(m => `
      <button type="button" class="menu-item" data-name="${escapeAttr(m.name)}" data-price="${m.price}">
        <strong>${escapeHtml(m.name)}</strong>
        <span>${formatEuro(m.price)}</span>
      </button>`).join("");
    grid.querySelectorAll(".menu-item").forEach(btn => {
      btn.addEventListener("click", () => addToCart({
        name: btn.dataset.name,
        price: Number(btn.dataset.price),
      }));
    });
  }

  function addToCart(item) {
    const existing = cart.find(c => c.name === item.name);
    if (existing) existing.quantity += 1;
    else cart.push({ ...item, quantity: 1 });
    renderCart();
  }

  function renderCart() {
    const lines = $("cart-lines");
    if (!cart.length) {
      lines.innerHTML = '<p class="hint" style="margin:0">Zgjidhni artikuj nga menuja</p>';
    } else {
      lines.innerHTML = cart.map((it, idx) => `
        <div class="cart-line">
          <span>${it.quantity}× ${escapeHtml(it.name)}</span>
          <span>
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
      await api(`/api/kiosk/${encodeURIComponent(slug)}/order${apiQuery()}`, {
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
      alert(`Porosia u dërgua te banaku për T${tableNumber}!`);
    } catch (e) {
      showErr(err, e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Dërgo porosinë te banaku";
    }
  });

  loadBootstrap().catch(e => showErr($("order-err"), e.message));

  async function refreshMenu() {
    if (!bootstrap) return;
    try {
      const data = await api(`/api/kiosk/${encodeURIComponent(slug)}/menu${apiQuery()}`);
      if (data.synced_at && data.synced_at === bootstrap.synced_at) return;
      bootstrap.synced_at = data.synced_at;
      bootstrap.menu = data.menu;
      bootstrap.categories = data.categories;
      const hint = $("sync-hint");
      if (bootstrap.synced_at) {
        hint.textContent = `Menuja u sinkronizua: ${new Date(bootstrap.synced_at).toLocaleString("sq-AL")}. Porosia shkon te banaku — jo faturë.`;
      }
      if (activeCategory && !bootstrap.categories.includes(activeCategory)) {
        activeCategory = bootstrap.categories?.[0] || "";
      }
      renderCategories();
      renderMenu();
    } catch { /* ignore */ }
  }

  setInterval(refreshMenu, 15000);
})();
