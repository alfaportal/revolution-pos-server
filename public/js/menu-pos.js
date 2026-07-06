/** UI e menusë mobile — kamarier + QR tavolinë. Grid foto-first, kategori dinamike. */
(function (root) {
  function normCat(name) {
    return String(name || "").trim().toLowerCase();
  }

  function categoryMatchesGroup(category, group) {
    if (!group || group === "all") return true;
    return normCat(category) === normCat(group);
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

  /** Emoji për secilën kategori (sipas emrit) */
  const CATEGORY_ICONS = {
    "pije të nxehta": "☕",
    "pije te nxehta": "☕",
    "pije të ftohta": "🥤",
    "pije te ftohta": "🥤",
    "birra": "🍺",
    "alkohole vera": "🍷",
    "alkohole & vera": "🍷",
    "ushqime": "🍔",
    "ushqim": "🍔",
    "ëmbëlsira": "🍰",
    "embelsira": "🍰",
    "snacks": "🍿",
    "tjera": "📦",
  };

  function categoryIcon(catName) {
    const n = normCat(catName);
    if (CATEGORY_ICONS[n]) return CATEGORY_ICONS[n];
    if (n.includes("pije") && n.includes("nxeht")) return "☕";
    if (n.includes("pije") && n.includes("ftoht")) return "🥤";
    if (n.includes("pije")) return "🥤";
    if (n.includes("birr")) return "🍺";
    if (n.includes("alkool") || n.includes("ver")) return "🍷";
    if (n.includes("ushqi")) return "🍔";
    if (n.includes("mbëlsir") || n.includes("mbelsir") || n.includes("dessert")) return "🍰";
    if (n.includes("snack")) return "🍿";
    return "📋";
  }

  function itemEmoji(item) {
    const name = normCat(item?.name);
    for (const [re, emoji] of EMOJI_RULES) {
      if (re.test(name)) return emoji;
    }
    return categoryIcon(item?.category) || "🍽️";
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

  function createMenuItemButton(item, { onSelect, disabled, formatEuro }) {
    const soldOut = Boolean(item.out_of_stock || item.sold_out);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "menu-item-btn" + (soldOut ? " menu-item-sold-out-btn" : "");
    btn.disabled = !!disabled || soldOut;
    btn.setAttribute("aria-label", `${item.name}, ${formatEuro(item.price)}`);

    const card = document.createElement("div");
    card.className = "menu-item-card";

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

  /**
   * Ndërto tab-bar dinamike nga lista e kategorive.
   * @param {HTMLElement} barEl - kontejneri ku shtohen tab-at
   * @param {string[]} categories - lista e kategorive nga bootstrap
   * @param {function} onChange - thirret me emrin e kategorisë kur klikohet
   * @param {string} [defaultCat] - kategoria fillestare
   */
  function buildCategoryTabs(barEl, categories, onChange, defaultCat) {
    if (!barEl) return;
    barEl.innerHTML = "";
    if (!categories || !categories.length) return;

    const wrap = document.createElement("div");
    wrap.className = "menu-cat-tabs";

    categories.forEach(cat => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "menu-cat-tab";
      btn.dataset.category = cat;

      const icon = document.createElement("span");
      icon.className = "menu-tab-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = categoryIcon(cat);

      const label = document.createElement("span");
      label.className = "menu-tab-label";
      label.textContent = cat;

      btn.appendChild(icon);
      btn.appendChild(label);
      wrap.appendChild(btn);
    });

    barEl.appendChild(wrap);

    const buttons = [...wrap.querySelectorAll(".menu-cat-tab")];

    function activate(catName) {
      buttons.forEach(b => {
        b.classList.toggle("active", b.dataset.category === catName);
      });
      onChange(catName);
    }

    buttons.forEach(btn => {
      btn.addEventListener("click", () => activate(btn.dataset.category));
    });

    const initial = defaultCat && categories.includes(defaultCat)
      ? defaultCat
      : categories[0];
    activate(initial);
  }

  root.MenuPosUI = {
    categoryMatchesGroup,
    categoryIcon,
    itemEmoji,
    renderMenuGrid,
    renderMenuSections: renderMenuGrid,
    buildCategoryTabs,
    flashButton(btn) {
      if (!btn) return;
      btn.classList.add("menu-item-flash");
      setTimeout(() => btn.classList.remove("menu-item-flash"), 400);
    },
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
