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
    /\b(pizza|pasta|mish|supa|supë|salat|sandwi|hamburger|fast\s*food|mengjes|mëngjes|embelsira|embel|desert|peshk|fruta\s*deti|tradicionale|shoqerime|femij|fëmij|nugget|qofte|wrap)\b/.test(
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
    n.includes("alkool") ||
    n.includes("birra") ||
    n.includes("birre") ||
    n === "vera" ||
    n.includes("vere") ||
    n.includes("verë") ||
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
    n.includes("energji") ||
    n.includes("energy") ||
    n.includes("caj") ||
    n.includes("çaj") ||
    n.includes("tea") ||
    n.includes("uje") ||
    n.includes("water") ||
    n.includes("sok") ||
    n.includes("juice")
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
    /\b(pizza|pasta|mish|supa|salat|sandwi|hamburger|burger|nugget|qofte|wrap|pasta|rizotto)\b/.test(n)
  ) {
    return false;
  }
  return (
    /\b(espresso|cappuccino|latte|americano|macchiato|moka|kafe|coffee|tea|caj|çaj|birra|beer|wine|verë|vera|cocktail|koktej|coca|fanta|sprite|pepsi|uje|water|sok|juice|smoothie|milkshake|energji|red\s*bull|tonic|gin|raki|viski|whisky|vodka|mojito)\b/.test(
      n,
    ) || n.includes("espresso")
  );
}

module.exports = {
  normCat,
  isDrinkCategory,
  isFoodCategory,
  isDrinkItemName,
};
