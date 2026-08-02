/** Pije vs ushqim — i njëjti koncept si KAFENE/menu-groups.js */

function normCat(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Vetëm a-z0-9 — për match agresiv (shmang karaktere “të ngjashme”). */
function foldAscii(name) {
  return normCat(name).replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Pije → banak / bar.
 * Ushqim → kuzhinë.
 */
function isDrinkCategory(category) {
  const n = normCat(category);
  if (!n) return false;
  const f = foldAscii(category);

  // Ushqim i qartë — mos e trajto si pije
  if (
    /\b(pizza|pasta|mish|supa|supe|salat|sandwi|hamburger|fast\s*food|mengjes|embelsira|embel|desert|peshk|fruta\s*deti|tradicionale|shoqerime|femij|nugget|qofte|wrap|rizotto|risotto)\b/.test(
      f,
    )
  ) {
    return false;
  }

  return (
    n.startsWith("pije") ||
    n.includes("pije") ||
    n.includes("pijet") ||
    n.includes("alkool") ||
    n.includes("birra") ||
    n.includes("birre") ||
    n === "vera" ||
    n.includes("vere") ||
    n.includes("wine") ||
    n.includes("kafe") ||
    n.includes("coffee") ||
    n.includes("espresso") ||
    n.includes("cappuccino") ||
    n.includes("latte") ||
    n.includes("cocktail") ||
    n.includes("coctail") ||
    n.includes("koktej") ||
    n.includes("beer") ||
    n.includes("soft drink") ||
    n.includes("softdrink") ||
    n.includes("energji") ||
    n.includes("energy") ||
    n.includes("caj") ||
    n.includes("tea") ||
    n.includes("uje") ||
    n.includes("water") ||
    n.includes("sok") ||
    n.includes("juice") ||
    n.includes("drink") ||
    n.includes("beverage") ||
    n.includes("bar ") ||
    n === "bar" ||
    n.includes("te ftoht") ||
    n.includes("te ngroht") ||
    n.includes("ngrohta") ||
    n.includes("ftohta") ||
    n.includes("qumesht") ||
    n.includes("milk") ||
    n.includes("smoothie") ||
    n.includes("shake") ||
    f.includes("espress") ||
    f.includes("kafe") ||
    f.includes("pije")
  );
}

function isFoodCategory(category) {
  const n = normCat(category);
  if (!n) return false;
  return !isDrinkCategory(n);
}

/**
 * Emri i artikullit — PRIORITET mbi kategorinë.
 * "Espresso i dyfishtë" = pije edhe nëse kategoria thotë Pizza/Ushqim.
 */
function isDrinkItemName(name) {
  const f = foldAscii(name);
  if (!f) return false;

  // Ushqim i qartë në EMËR (jo kategori)
  if (
    /\b(pizza|pasta|mish|supa|supe|salat|sandwi|hamburger|burger|nugget|qofte|wrap|rizotto|risotto|steak|fileto|skara)\b/.test(
      f,
    )
  ) {
    // Emër i përzier "Pizza + birra" — nëse ka sinjal pije, mbetet pije
    if (
      !(
        f.includes("espress") ||
        f.includes("cappuccin") ||
        f.includes("kafe") ||
        f.includes("coffee") ||
        f.includes("birra") ||
        f.includes("pije")
      )
    ) {
      return false;
    }
  }

  // Match agresiv me includes — pa u mbështetur vetëm te \b
  if (
    f.includes("espress") ||
    f.includes("cappuccin") ||
    f.includes("macchiato") ||
    f.includes("americano") ||
    f.includes("latte") ||
    f.includes("mocha") ||
    f.includes("frappe") ||
    f.includes("frape") ||
    f.includes("nescafe") ||
    f.includes("coffee") ||
    f.includes("kafe") ||
    f.includes("cappuccino") ||
    f.includes("birra") ||
    f.includes("beer") ||
    f.includes("cocktail") ||
    f.includes("koktej") ||
    f.includes("coca") ||
    f.includes("cola") ||
    f.includes("fanta") ||
    f.includes("sprite") ||
    f.includes("pepsi") ||
    f.includes("smoothie") ||
    f.includes("milkshake") ||
    f.includes("energji") ||
    f.includes("redbull") ||
    f.includes("mojito") ||
    f.includes("ayran") ||
    f.includes("limonad") ||
    f.includes("qumesht") ||
    f.includes("icetea") ||
    f.includes("ice tea") ||
    /\b(tea|caj|uje|water|sok|juice|wine|vere|vera|raki|viski|whisky|whiskey|vodka|gin|tonic|pije)\b/.test(
      f,
    )
  ) {
    return true;
  }

  return false;
}

module.exports = {
  normCat,
  foldAscii,
  isDrinkCategory,
  isFoodCategory,
  isDrinkItemName,
};
