/** UI e menusë mobile — kamarier + QR tavolinë. Grid foto-first, Pije / Ushqim. */
(function (root) {
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

  const EMOJI_RULES = [
    [/coca|cola|pepsi|fanta|sprite|schweppes|mirinda/, "🥤"],
    [/red\s*bull|monster|energj/i, "⚡"],
    [/kafe|espresso|cappuccino|latte|macchiato|moka|americano/, "☕"],
    [/çaj|caj|tea|ice\s*tea|icetea/, "🍵"],
    [/ujë|uje|water|mineral/, "💧"],
    [/lëng|leng|juice|smoothie|frut/, "🧃"],
    [/birr|beer|ver[eë]|wine|whisk|rak[ij]|alkool|cocktail|mojito|spritz/, "🍺"],
    [/pizza/, "🍕"],
    [/burger|hamburger/, "🍔"],
    [/sandwich|toast|bagel/, "🥪"],
    [/pasta|spaghetti|lasagn|makaron/, "🍝"],
    [/salat|salad/, "🥗"],
    [/sup[eë]|soup|corb/, "🍲"],
    [/embelsir|dessert|akullore|ice\s*cream|tort|cake|krempit/, "🍰"],
    [/mish|steak|qebap|kebab|grill|zgar/, "🥩"],
    [/pule|chicken|nuggets/, "🍗"],
    [/peshk|fish|salmon/, "🐟"],
    [/omlet|veze|egg/, "🍳"],
    [/patate|fries|chips/, "🍟"],
    [/sushi/, "🍣"],
    [/taco|burrito|mex/, "🌮"],
  ];

  const GROUP_TABS = {
    pije: { icon: "🥤", label: "Pije" },
    ushqim: { icon: "🍽️", label: "Ushqim" },
  };

  function itemEmoji(item) {
    const name = normCat(item?.name);
    for (const [re, emoji] of EMOJI_RULES) {
      if (re.test(name)) return emoji;
    }
    if (isDrinkCategory(item?.category)) return "🥤";
    return "🍽️";
  }

  function itemHasPhoto(item) {
    return Boolean(item?.has_photo || String(item?.photo || "").trim() || item?.photo_url);
  }

  function defaultPhotoUrl(item) {
    if (item?.photo_url) return String(item.photo_url);
    if (!item?.id) return "";
    return `/api/menu/${item.id}/photo`;
  }

  function createPlaceholder(item, photoWrap) {
    const ph = document.createElement("span");
    ph.className = "menu-item-emoji-ph";
    ph.textContent = itemEmoji(item);
    ph.setAttribute("aria-hidden", "true");
    photoWrap.appendChild(ph);
  }

  function createMenuItemButton(item, { onSelect, disabled, formatEuro, getPhotoUrl }) {
    const resolvePhoto = getPhotoUrl || defaultPhotoUrl;
    const soldOut = Boolean(item.out_of_stock || item.sold_out);
    const isDrink = isDrinkCategory(item.category);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "menu-item-btn" + (soldOut ? " menu-item-sold-out-btn" : "");
    btn.disabled = !!disabled || soldOut;
    btn.setAttribute("aria-label", `${item.name}, ${formatEuro(item.price)}`);

    const card = document.createElement("div");
    card.className = "menu-item-card";

    const photoWrap = document.createElement("div");
    photoWrap.className = "menu-item-photo-wrap" + (isDrink ? " is-drink" : " is-food");

    if (itemHasPhoto(item)) {
      const img = document.createElement("img");
      img.className = "menu-item-photo";
      img.alt = item.name || "";
      img.loading = "lazy";
      img.decoding = "async";
      img.src = resolvePhoto(item);
      img.onerror = () => {
        img.remove();
        createPlaceholder(item, photoWrap);
      };
      photoWrap.appendChild(img);
    } else {
      createPlaceholder(item, photoWrap);
    }

    card.appendChild(photoWrap);

    const meta = document.createElement("div");
    meta.className = "menu-item-meta";

    const emri = document.createElement("span");
    emri.className = "emri";
    emri.textContent = item.name;
    meta.appendChild(emri);

    const cmimi = document.createElement("span");
    cmimi.className = "cmimi-badge" + (Number(item.price) >= 5 ? " is-gold" : "");
    cmimi.textContent = soldOut ? (item.sold_out_label || "Mbaroi") : formatEuro(item.price);
    meta.appendChild(cmimi);

    card.appendChild(meta);
    btn.appendChild(card);

    if (soldOut) btn.classList.add("is-sold-out");
    if (!soldOut) btn.addEventListener("click", () => onSelect(item, btn));
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
      container.innerHTML = '<p class="menu-empty-msg">Nuk ka artikuj për këtë filtër</p>';
      return;
    }

    const grid = document.createElement("div");
    grid.className = "menu-photo-grid-inner";
    for (const it of items) {
      try {
        const btn = createMenuItemButton(it, {
          onSelect: onSelectItem,
          disabled,
          formatEuro,
          getPhotoUrl,
        });
        if (btn) grid.appendChild(btn);
      } catch (err) {
        console.error("[menu-pos] render item:", err);
      }
    }
    container.appendChild(grid);
  }

  function ensureGroupBarIcons(barEl) {
    if (!barEl) return;
    barEl.querySelectorAll(".menu-group-btn").forEach(btn => {
      const group = btn.dataset.group || "pije";
      const tab = GROUP_TABS[group] || { icon: "📋", label: group };
      if (btn.querySelector(".menu-tab-icon")) return;
      const label = btn.textContent.trim().replace(/[\u{1F300}-\u{1FAFF}]/gu, "").trim() || tab.label;
      btn.textContent = "";
      const icon = document.createElement("span");
      icon.className = "menu-tab-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = tab.icon;
      const text = document.createElement("span");
      text.className = "menu-tab-label";
      text.textContent = label;
      btn.appendChild(icon);
      btn.appendChild(text);
    });
  }

  function bindGroupBar(barEl, onChange, { defaultGroup = "pije" } = {}) {
    if (!barEl) return;
    ensureGroupBarIcons(barEl);
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

  root.MenuPosUI = {
    categoryMatchesGroup,
    isDrinkCategory,
    itemEmoji,
    renderMenuGrid,
    renderMenuSections: renderMenuGrid,
    bindGroupBar,
    flashButton(btn) {
      if (!btn) return;
      btn.classList.add("menu-item-flash");
      setTimeout(() => btn.classList.remove("menu-item-flash"), 400);
    },
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
