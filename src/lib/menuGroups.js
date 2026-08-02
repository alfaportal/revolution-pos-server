/** Pije vs ushqim — i njëjti koncept si KAFENE/menu-groups.js */

function normCat(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/**
 * Pije → banak / bar.
 * Ushqim → kuzhinë.
 */
function isDrinkCategory(category) {
  const n = normCat(category);
  if (!n) return false;

  // Ushqim i qartë — mos e trajto si pije
  if (
    /\b(pizza|pasta|mish|supa|supe|salat|sandwi|hamburger|fast\s*food|mengjes|mengjes|embelsira|embel|desert|peshk|fruta\s*deti|tradicionale|shoqerime|femij|nugget|qofte|wrap|rizotto|risotto)\b/.test(
      n,
    ) ||
    n.includes("hamburger") ||
    n.includes("sandwi") ||
    n.includes("tradicionale")
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
    n.includes("shake")
  );
}

function isFoodCategory(category) {
  const n = normCat(category);
  if (!n) return false;
  return !isDrinkCategory(n);
}

/** Emri i artikullit — fallback kur kategoria mungon / është e gabuar */
function isDrinkItemName(name) {
  const n = normCat(name);
  if (!n) return false;
  if (
    /\b(pizza|pasta|mish|supa|supe|salat|sandwi|hamburger|burger|nugget|qofte|wrap|rizotto|risotto|steak|file|skara)\b/.test(
      n,
    )
  ) {
    return false;
  }
  return (
    /\b(espresso|cappuccino|latte|americano|macchiato|moka|mocha|frappe|frape|nescafe|kafe|coffee|tea|caj|birra|beer|wine|vere|vera|cocktail|koktej|coca|cola|fanta|sprite|pepsi|uje|water|sok|juice|smoothie|milkshake|milk\s*shake|energji|energy|red\s*bull|tonic|gin|raki|viski|whisky|whiskey|vodka|mojito|ayran|airan|boza|limonad|lemonade|ice\s*tea|iced\s*tea|qumesht|milk|shaorma\s*pije)\b/.test(
      n,
    ) ||
    n.includes("espresso") ||
    n.includes("cappuccino") ||
    n.startsWith("kafe") ||
    n.includes(" kafe") ||
    n.endsWith(" kafe")
  );
}

module.exports = {
  normCat,
  isDrinkCategory,
  isFoodCategory,
  isDrinkItemName,
};
