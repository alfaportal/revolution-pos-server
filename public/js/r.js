(function () {
  const PWA_KEY = "ri_restaurant_pwa_dismissed";
  let deferredPrompt = null;
  let pageData = null;

  function getSlug() {
    const parts = window.location.pathname.split("/").filter(Boolean);
    return parts[0] === "r" ? decodeURIComponent(parts[1] || "") : "";
  }

  function showScreen(id) {
    document.querySelectorAll(".screen").forEach(el => {
      const on = el.id === id;
      el.classList.toggle("active", on);
      el.classList.toggle("hidden", !on);
    });
  }

  function euro(n) {
    return Number(n || 0).toFixed(2) + " €";
  }

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function isIos() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  function initPwaBanner() {
    const banner = document.getElementById("pwa-banner");
    const hint = document.getElementById("pwa-hint");
    const closeBtn = document.getElementById("pwa-close");
    const installBtn = document.getElementById("pwa-install-btn");
    if (!banner || !hint) return;

    if (isStandalone() || localStorage.getItem(PWA_KEY) === "1") return;

    hint.textContent = isIos()
      ? "Kliko Share (□↑) → Add to Home Screen për akses të shpejtë."
      : "Instalo aplikacionin e restorantit në telefonin tuaj.";

    banner.classList.remove("hidden");
    document.body.classList.add("pwa-banner-visible");

    closeBtn?.addEventListener("click", () => {
      localStorage.setItem(PWA_KEY, "1");
      banner.classList.add("hidden");
      document.body.classList.remove("pwa-banner-visible");
    });

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (installBtn) {
        installBtn.classList.remove("hidden");
        installBtn.addEventListener("click", async () => {
          if (!deferredPrompt) return;
          deferredPrompt.prompt();
          await deferredPrompt.userChoice;
          deferredPrompt = null;
          banner.classList.add("hidden");
          document.body.classList.remove("pwa-banner-visible");
        });
      }
    });
  }

  function registerSw(slug) {
    if (!("serviceWorker" in navigator) || !slug) return;
    const enc = encodeURIComponent(slug);
    navigator.serviceWorker.register(`/r/${enc}/sw.js`, { scope: `/r/${enc}/` }).catch(() => {});
  }

  function applyTheme(color) {
    if (!color) return;
    document.documentElement.style.setProperty("--accent", color);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", color);
  }

  function renderHours(hoursDisplay) {
    const list = document.getElementById("hours-list");
    if (!list) return;
    list.innerHTML = (hoursDisplay || []).map(row => `
      <li><span class="day">${row.label}</span><span class="time">${row.text}</span></li>
    `).join("");
  }

  function renderMenu(categories, menu) {
    const nav = document.getElementById("cat-nav");
    const wrap = document.getElementById("menu-sections");
    if (!nav || !wrap) return;

    const cats = categories?.length
      ? categories
      : [...new Set((menu || []).map(i => i.category).filter(Boolean))];

    if (!cats.length) {
      wrap.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem 0">Menuja do të publikohet së shpejti.</p>';
      return;
    }

    nav.innerHTML = cats.map((cat, idx) =>
      `<button type="button" data-cat="${encodeURIComponent(cat)}" class="${idx === 0 ? "active" : ""}">${cat}</button>`,
    ).join("");

    wrap.innerHTML = cats.map(cat => {
      const items = (menu || []).filter(i => i.category === cat);
      const rows = items.map(it => `
        <div class="menu-item">
          <div class="menu-item-name">${escapeHtml(it.name)}</div>
          <div class="menu-item-price">${euro(it.price)}</div>
        </div>`).join("");
      return `
        <div class="menu-cat-block" id="cat-${encodeURIComponent(cat)}">
          <h3 class="menu-cat-title">${escapeHtml(cat)}</h3>
          ${rows || '<p style="color:var(--muted)">Nuk ka artikuj.</p>'}
        </div>`;
    }).join("");

    nav.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        nav.querySelectorAll("button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const id = `cat-${btn.dataset.cat}`;
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function googleMapsUrl(address, name) {
    const query = [name, address].filter(Boolean).join(", ").trim();
    if (!query) return "";
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  function renderPage(data) {
    pageData = data;
    document.title = data.name || "Restorant";
    const appleIcon = document.getElementById("apple-icon");
    if (appleIcon && data.logo_url) appleIcon.href = data.logo_url;

    applyTheme(data.theme_color);
    document.getElementById("biz-name").textContent = data.name || "Restorant";

    const descEl = document.getElementById("biz-desc");
    if (data.description) {
      descEl.textContent = data.description;
      descEl.hidden = false;
    }

    const logoWrap = document.getElementById("hero-logo-wrap");
    const logoImg = document.getElementById("hero-logo");
    if (data.logo_url && logoImg) {
      logoImg.src = data.logo_url;
      logoImg.alt = data.name;
      logoWrap.hidden = false;
    }

    if (data.address) {
      document.getElementById("info-address").hidden = false;
      const addrEl = document.getElementById("val-address");
      const mapsUrl = googleMapsUrl(data.address, data.name);
      addrEl.textContent = data.address;
      addrEl.href = mapsUrl || "#";
      addrEl.setAttribute("aria-label", `Hap ${data.address} në Google Maps`);
    }

    if (data.phone) {
      document.getElementById("info-phone").hidden = false;
      const phoneEl = document.getElementById("val-phone");
      const tel = data.phone.replace(/\s/g, "");
      phoneEl.href = `tel:${tel}`;
      phoneEl.textContent = data.phone;
    }

    renderHours(data.hours_display);
    renderMenu(data.categories, data.menu);

    const orderBar = document.getElementById("order-bar");
    const orderBtn = document.getElementById("btn-order");
    if (orderBar && orderBtn) {
      if (data.kiosk_url) {
        orderBtn.href = data.kiosk_url;
        orderBar.hidden = false;
      } else {
        orderBtn.removeAttribute("href");
        orderBar.hidden = true;
      }
    }

    showScreen("screen-main");
  }

  async function loadPage() {
    const slug = getSlug();
    if (!slug) {
      document.getElementById("error-msg").textContent = "URL e pavlefshme.";
      showScreen("screen-error");
      return;
    }

    showScreen("screen-loading");
    registerSw(slug);
    initPwaBanner();

    try {
      const res = await fetch(`/api/r/${encodeURIComponent(slug)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        document.getElementById("error-msg").textContent = data.gabim || "Restoranti nuk u gjet.";
        showScreen("screen-error");
        return;
      }
      renderPage(data);
    } catch (err) {
      document.getElementById("error-msg").textContent = err.message || "Gabim rrjeti.";
      showScreen("screen-error");
    }
  }

  loadPage();
})();
