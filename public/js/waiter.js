(function () {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const clientId = parts[0] === "waiter" ? parts[1] : "";

  const LS_WAITER = `waiter_name_${clientId}`;

  let bootstrap = null;
  let waiterName = "";
  let tableNumber = 0;
  let cart = [];
  let activeCategory = "";

  const $ = id => document.getElementById(id);

  function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    $(id).classList.add("active");
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

  async function api(path, opts = {}) {
    const res = await fetch(path, {
      headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
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
    if (!clientId) throw new Error("URL i gabuar. Duhet /waiter/[client_id]");
    bootstrap = await api(`/api/waiter/${encodeURIComponent(clientId)}/bootstrap`);
    $("login-title").textContent = bootstrap.restaurant_name || bootstrap.client_name || "Kamarieri";
    $("tables-title").textContent = bootstrap.restaurant_name || "Tavolinat";
    const hint = $("sync-hint");
    if (bootstrap.synced_at) {
      hint.textContent = `Menuja u sinkronizua: ${new Date(bootstrap.synced_at).toLocaleString("sq-AL")}`;
    } else {
      hint.textContent = "Menuja ende nuk është sinkronizuar nga POS-i lokal.";
    }
    const dl = $("staff-list");
    dl.innerHTML = (bootstrap.staff || []).map(n => `<option value="${escapeAttr(n)}">`).join("");
  }

  function escapeAttr(s) {
    return String(s || "").replace(/"/g, "&quot;");
  }

  function renderTables() {
    const grid = $("tables-grid");
    if (!bootstrap?.tables?.length) {
      grid.innerHTML = '<p class="hint">Nuk ka tavolina. Sinkronizoni nga POS.</p>';
      return;
    }
    grid.innerHTML = bootstrap.tables.map(t => `
      <button type="button" class="table-card ${t.status}" data-table="${t.number}">
        <div class="num">T${t.number}</div>
        <div class="meta">${t.status === "occupied"
          ? `${escapeHtml(t.waiter_name || "E zënë")}<br>${formatEuro(t.order_total || 0)}`
          : "E lirë"}</div>
      </button>`).join("");
    grid.querySelectorAll("[data-table]").forEach(btn => {
      btn.addEventListener("click", () => openOrder(Number(btn.dataset.table)));
    });
  }

  function escapeHtml(s) {
    return String(s || "").replace(/</g, "&lt;");
  }

  function openOrder(num) {
    tableNumber = num;
    cart = [];
    activeCategory = bootstrap.categories?.[0] || "";
    $("order-title").textContent = `T${num}`;
    renderCategories();
    renderMenu();
    renderCart();
    showScreen("screen-order");
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
      grid.innerHTML = '<p class="hint">Nuk ka artikuj në këtë kategori.</p>';
      return;
    }
    grid.innerHTML = items.map(m => `
      <button type="button" class="menu-item" data-id="${m.id}" data-name="${escapeAttr(m.name)}" data-price="${m.price}">
        <strong>${escapeHtml(m.name)}</strong>
        <span>${formatEuro(m.price)}</span>
      </button>`).join("");
    grid.querySelectorAll(".menu-item").forEach(btn => {
      btn.addEventListener("click", () => addToCart({
        id: Number(btn.dataset.id),
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
      lines.innerHTML = '<p class="hint" style="margin:0">Shtoni artikuj nga menuja</p>';
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

  async function refreshTables() {
    try {
      const data = await api(`/api/waiter/${encodeURIComponent(clientId)}/bootstrap`);
      bootstrap.tables = data.tables;
      bootstrap.synced_at = data.synced_at;
      renderTables();
    } catch { /* ignore background refresh */ }
  }

  $("btn-login").addEventListener("click", async () => {
    const err = $("login-err");
    showErr(err, "");
    const name = $("waiter-name").value.trim();
    if (!name) {
      showErr(err, "Shkruani emrin tuaj.");
      return;
    }
    try {
      if (!bootstrap) await loadBootstrap();
      waiterName = name;
      localStorage.setItem(LS_WAITER, name);
      $("tables-waiter").textContent = `Kamarieri: ${name}`;
      renderTables();
      showScreen("screen-tables");
    } catch (e) {
      showErr(err, e.message);
    }
  });

  $("waiter-name").addEventListener("keydown", e => {
    if (e.key === "Enter") $("btn-login").click();
  });

  $("btn-logout").addEventListener("click", () => {
    localStorage.removeItem(LS_WAITER);
    waiterName = "";
    showScreen("screen-login");
  });

  $("btn-back").addEventListener("click", () => {
    refreshTables();
    showScreen("screen-tables");
  });

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
      await api(`/api/waiter/${encodeURIComponent(clientId)}/orders`, {
        method: "POST",
        body: JSON.stringify({
          waiter_name: waiterName,
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
      alert("Porosia u dërgua te kuzhina!");
      await refreshTables();
      showScreen("screen-tables");
    } catch (e) {
      showErr(err, e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Dërgo porosinë";
    }
  });

  (async () => {
    try {
      await loadBootstrap();
      const saved = localStorage.getItem(LS_WAITER);
      if (saved) {
        $("waiter-name").value = saved;
      }
    } catch (e) {
      showErr($("login-err"), e.message);
    }
  })();

  setInterval(() => {
    if ($("screen-tables").classList.contains("active")) refreshTables();
  }, 8000);
})();
