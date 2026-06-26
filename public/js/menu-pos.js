/** UI e menusë — grid foto-first, Pije / Ushqim, tap = shto në porosi. */
(function (global) {
  function normCat(name) {
    return String(name || "").trim().toLowerCase();
  }

  function isDrinkCategory(name) {
    const n = normCat(name);
    return n.startsWith("pije") || n.includes("alkool") || n.includes("alkoolike");
  }

  function categoryMatchesGroup(category, group) {
    if (group === "pije") return isDrinkCategory(category);
    if (group === "ushqim") return !isDrinkCategory(category);
    return true;
  }

  function placeholderHue(name) {
    let h = 0;
    const s = String(name || "");
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return h;
  }

  function firstLetter(name) {
    const ch = String(name || "").trim().charAt(0);
    return ch ? ch.toUpperCase() : "?";
  }

  function itemHasPhoto(item) {
    return Boolean(item?.has_photo || String(item?.photo || "").trim() || item?.photo_url);
  }

  function defaultPhotoUrl(item) {
    if (item?.photo_url) return String(item.photo_url);
    if (!item?.id) return "";
    return `/api/menu/${item.id}/photo`;
  }

  function createMenuItemButton(item, { onSelect, disabled, formatEuro, getPhotoUrl }) {
    const resolvePhoto = getPhotoUrl || defaultPhotoUrl;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "menu-item-btn";
    btn.disabled = !!disabled;

    const photoWrap = document.createElement("div");
    photoWrap.className = "menu-item-photo-wrap";

    if (itemHasPhoto(item)) {
      const img = document.createElement("img");
      img.className = "menu-item-photo";
      img.alt = item.name || "";
      img.loading = "lazy";
      img.decoding = "async";
      img.src = resolvePhoto(item);
      img.onerror = () => {
        img.remove();
        const ph = document.createElement("span");
        ph.className = "menu-item-letter-ph";
        ph.textContent = firstLetter(item.name);
        ph.style.background = `hsl(${placeholderHue(item.name)}, 52%, 45%)`;
        photoWrap.appendChild(ph);
      };
      photoWrap.appendChild(img);
    } else {
      const ph = document.createElement("span");
      ph.className = "menu-item-letter-ph";
      ph.textContent = firstLetter(item.name);
      ph.style.background = `hsl(${placeholderHue(item.name)}, 52%, 45%)`;
      photoWrap.appendChild(ph);
    }

    btn.appendChild(photoWrap);

    const emri = document.createElement("span");
    emri.className = "emri";
    emri.textContent = item.name;
    btn.appendChild(emri);

    const cmimi = document.createElement("span");
    cmimi.className = "cmimi";
    cmimi.textContent = formatEuro(item.price);
    btn.appendChild(cmimi);

    btn.addEventListener("click", () => onSelect(item, btn));
    return btn;
  }

  function renderMenuGrid({
    container,
    menuItems,
    groupFilter,
    onSelectItem,
    disabled,
    formatEuro,
    getPhotoUrl,
  }) {
    if (!container) return;
    container.innerHTML = "";

    const items = (menuItems || []).filter(i =>
      categoryMatchesGroup(i.category, groupFilter),
    );

    if (!items.length) {
      container.innerHTML =
        '<p class="menu-empty-msg">Nuk ka artikuj për këtë filtër</p>';
      return;
    }

    const grid = document.createElement("div");
    grid.className = "menu-photo-grid-inner";
    for (const it of items) {
      grid.appendChild(createMenuItemButton(it, {
        onSelect: onSelectItem,
        disabled,
        formatEuro,
        getPhotoUrl,
      }));
    }
    container.appendChild(grid);
  }

  function bindGroupBar(barEl, onChange, { defaultGroup = "pije" } = {}) {
    if (!barEl) return;
    const buttons = [...barEl.querySelectorAll(".menu-group-btn")];

    function activate(group) {
      buttons.forEach(b => {
        b.classList.toggle("active", (b.dataset.group || "") === group);
      });
      onChange(group);
    }

    buttons.forEach(btn => {
      btn.addEventListener("click", () => activate(btn.dataset.group || "pije"));
    });

    const initial = buttons.some(b => b.dataset.group === defaultGroup)
      ? defaultGroup
      : (buttons[0]?.dataset.group || "pije");
    activate(initial);
  }

  global.MenuPosUI = {
    categoryMatchesGroup,
    isDrinkCategory,
    renderMenuGrid,
    renderMenuSections: renderMenuGrid,
    bindGroupBar,
    flashButton(btn) {
      if (!btn) return;
      btn.classList.add("menu-item-flash");
      setTimeout(() => btn.classList.remove("menu-item-flash"), 350);
    },
  };
})(window);
