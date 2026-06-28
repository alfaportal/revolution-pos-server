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
      const rows = items.map(it => {
        const thumb = it.photo_url
          ? `<button type="button" class="menu-item-photo-btn" data-photo="${escapeAttr(it.photo_url)}" data-name="${escapeAttr(it.name)}" aria-label="Shiko foton e ${escapeAttr(it.name)}">
              <img class="menu-item-photo" src="${escapeAttr(it.photo_url)}" alt="" loading="lazy" width="80" height="80">
            </button>`
          : "";
        return `
        <div class="menu-item${it.photo_url ? " has-photo" : ""}">
          ${thumb}
          <div class="menu-item-body">
            <div class="menu-item-name">${escapeHtml(it.name)}</div>
            <div class="menu-item-price">${euro(it.price)}</div>
          </div>
        </div>`;
      }).join("");
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

    bindMenuPhotoLightbox();
  }

  function escapeAttr(s) {
    return String(s ?? "").replace(/"/g, "&quot;");
  }

  function renderStars(count) {
    const n = Math.max(1, Math.min(5, Number(count) || 0));
    return "★".repeat(n) + "☆".repeat(5 - n);
  }

  function renderDailyOffer(text) {
    const banner = document.getElementById("daily-offer-banner");
    const el = document.getElementById("daily-offer-text");
    const t = String(text || "").trim();
    if (!banner || !el || !t) {
      banner?.classList.add("hidden");
      return;
    }
    el.textContent = t;
    banner.classList.remove("hidden");
  }

  function renderGallery(urls) {
    const section = document.getElementById("gallery-section");
    const grid = document.getElementById("gallery-grid");
    const list = (urls || []).filter(Boolean);
    if (!section || !grid || !list.length) {
      section?.classList.add("hidden");
      if (grid) grid.innerHTML = "";
      return;
    }
    grid.innerHTML = list.map((url, idx) => `
      <button type="button" class="gallery-item" data-photo="${escapeAttr(url)}" data-name="Galeria ${idx + 1}" aria-label="Shiko foton ${idx + 1}">
        <img src="${escapeAttr(url)}" alt="Foto ${idx + 1}" loading="lazy">
      </button>
    `).join("");
    section.classList.remove("hidden");
    grid.querySelectorAll(".gallery-item").forEach(btn => {
      btn.addEventListener("click", () => openPhotoLightbox(btn.dataset.photo, btn.dataset.name));
    });
  }

  function renderReviews(reviews) {
    const section = document.getElementById("reviews-section");
    const listEl = document.getElementById("reviews-list");
    const rows = (reviews || []).filter(r => r?.name);
    if (!section || !listEl || !rows.length) {
      section?.classList.add("hidden");
      if (listEl) listEl.innerHTML = "";
      return;
    }
    listEl.innerHTML = rows.map(r => `
      <article class="review-card">
        <div class="review-stars" aria-label="${r.stars} yje">${renderStars(r.stars)}</div>
        <div class="review-name">${escapeHtml(r.name)}</div>
        ${r.text ? `<p class="review-text">${escapeHtml(r.text)}</p>` : ""}
      </article>
    `).join("");
    section.classList.remove("hidden");
  }

  function renderContactActions(data) {
    const wrap = document.getElementById("contact-actions");
    const waBtn = document.getElementById("btn-whatsapp");
    const socialEl = document.getElementById("social-links");
    if (!wrap) return;

    let any = false;

    if (waBtn) {
      const wa = String(data?.whatsapp_url || "").trim();
      if (wa) {
        waBtn.href = wa;
        waBtn.classList.remove("hidden");
        waBtn.onclick = (e) => {
          e.preventDefault();
          openExternalUrl(wa);
        };
        any = true;
      } else {
        waBtn.classList.add("hidden");
      }
    }

    if (socialEl) {
      const social = data?.social || {};
      const items = [];
      if (social.instagram) {
        items.push({ label: "Instagram", url: social.instagram, icon: "📷" });
      }
      if (social.facebook) {
        items.push({ label: "Facebook", url: social.facebook, icon: "👍" });
      }
      if (social.tiktok) {
        items.push({ label: "TikTok", url: social.tiktok, icon: "🎵" });
      }
      if (items.length) {
        socialEl.innerHTML = items.map(it => `
          <a class="social-link" href="${escapeAttr(it.url)}" target="_blank" rel="noopener noreferrer">
            <span aria-hidden="true">${it.icon}</span>${escapeHtml(it.label)}
          </a>
        `).join("");
        socialEl.classList.remove("hidden");
        any = true;
      } else {
        socialEl.innerHTML = "";
        socialEl.classList.add("hidden");
      }
    }

    wrap.classList.toggle("hidden", !any);
  }

  function openPhotoLightbox(url, name) {
    const box = document.getElementById("menu-photo-lightbox");
    const img = document.getElementById("menu-photo-lightbox-img");
    const caption = document.getElementById("menu-photo-lightbox-caption");
    if (!box || !img || !url) return;
    img.src = url;
    img.alt = name || "";
    if (caption) caption.textContent = name || "";
    box.classList.remove("hidden");
    document.body.classList.add("menu-lightbox-open");
  }

  function bindMenuPhotoLightbox() {
    const box = document.getElementById("menu-photo-lightbox");
    const img = document.getElementById("menu-photo-lightbox-img");
    const caption = document.getElementById("menu-photo-lightbox-caption");
    const closeBtn = document.getElementById("menu-photo-close");
    if (!box || !img) return;

    const close = () => {
      box.classList.add("hidden");
      img.removeAttribute("src");
      if (caption) caption.textContent = "";
      document.body.classList.remove("menu-lightbox-open");
    };

    document.querySelectorAll(".menu-item-photo-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        openPhotoLightbox(btn.getAttribute("data-photo") || "", btn.getAttribute("data-name") || "");
      });
    });

    closeBtn?.addEventListener("click", close);
    box.addEventListener("click", (e) => {
      if (e.target === box) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !box.classList.contains("hidden")) close();
    });
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function googleMapsUrl(address) {
    const query = String(address || "").trim();
    if (!query) return "";
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  function openExternalUrl(url) {
    if (!url) return;
    if (isStandalone()) {
      window.location.assign(url);
      return;
    }
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) window.location.assign(url);
  }

  /** Upgrade legacy cached markup to the current address card layout. */
  function ensureAddressCard() {
    let card = document.getElementById("info-address");
    if (!card) return null;

    if (card.tagName === "A") {
      const address = card.querySelector("#val-address")?.textContent?.trim()
        || card.textContent.replace(/Hap në Google Maps/gi, "").trim();
      const div = document.createElement("div");
      div.id = "info-address";
      div.className = "info-card";
      div.hidden = card.hidden;
      div.innerHTML = `
        <span class="info-icon" aria-hidden="true">📍</span>
        <div class="info-address-body">
          <div class="info-label">Adresa</div>
          <div class="info-value" id="val-address"></div>
          <a class="maps-btn" id="btn-maps-address" href="#" target="_blank" rel="noopener noreferrer">
            <span class="maps-btn-icon" aria-hidden="true">🗺️</span>
            Hap në Google Maps
          </a>
        </div>`;
      card.replaceWith(div);
      card = div;
      const textEl = document.getElementById("val-address");
      if (textEl && address) textEl.textContent = address;
    }

    if (!document.getElementById("btn-maps-address")) {
      const body = card.querySelector(".info-address-body") || card.querySelector("div");
      if (body) {
        const btn = document.createElement("a");
        btn.id = "btn-maps-address";
        btn.className = "maps-btn";
        btn.href = "#";
        btn.target = "_blank";
        btn.rel = "noopener noreferrer";
        btn.innerHTML = '<span class="maps-btn-icon" aria-hidden="true">🗺️</span> Hap në Google Maps';
        body.appendChild(btn);
      }
    }

    return card;
  }

  function bindMapsButton(btn, mapsUrl, label) {
    if (!btn || !mapsUrl) return;
    btn.href = mapsUrl;
    btn.setAttribute("aria-label", label || "Hap në Google Maps");
    btn.onclick = (e) => {
      e.preventDefault();
      openExternalUrl(mapsUrl);
    };
  }

  function renderAddress(data) {
    const address = String(data?.address || "").trim();
    if (!address) return;

    const mapsUrl = String(data?.maps_url || "").trim() || googleMapsUrl(address);
    if (!mapsUrl) return;

    const card = ensureAddressCard();
    if (!card) return;

    card.hidden = false;
    const textEl = document.getElementById("val-address");
    if (textEl) textEl.textContent = address;

    bindMapsButton(
      document.getElementById("btn-maps-address"),
      mapsUrl,
      `Hap ${address} në Google Maps`,
    );
  }

  function renderPage(data) {
    pageData = data;
    document.title = data.name || "Restorant";
    const appleIcon = document.getElementById("apple-icon");
    if (appleIcon && data.logo_url) appleIcon.href = data.logo_url;

    applyTheme(data.theme_color);
    document.getElementById("biz-name").textContent = data.name || "Restorant";

    const hero = document.getElementById("hero");
    const coverImg = document.getElementById("hero-cover");
    if (coverImg && data.cover_url) {
      coverImg.src = data.cover_url;
      coverImg.alt = data.name || "Cover";
      coverImg.classList.remove("hidden");
      hero?.classList.add("has-cover");
    } else {
      coverImg?.classList.add("hidden");
      hero?.classList.remove("has-cover");
    }

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

    renderAddress(data);

    if (data.phone) {
      document.getElementById("info-phone").hidden = false;
      const phoneEl = document.getElementById("val-phone");
      const tel = data.phone.replace(/\s/g, "");
      phoneEl.href = `tel:${tel}`;
      phoneEl.textContent = data.phone;
    }

    renderHours(data.hours_display);
    renderDailyOffer(data.daily_offer);
    renderGallery(data.gallery_urls);
    renderReviews(data.reviews);
    renderContactActions(data);
    renderMenu(data.categories, data.menu);

    const orderBar = document.getElementById("order-bar");
    const orderBtn = document.getElementById("btn-order");
    if (orderBar && orderBtn) {
      if (data.order_url) {
        orderBtn.href = data.order_url;
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
