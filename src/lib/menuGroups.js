/** Pije vs ushqim — i njëjti koncept si menu-pos.js */

function normCat(name) {
  return String(name || "").trim().toLowerCase();
}

function isDrinkCategory(category) {
  const n = normCat(category);
  if (!n) return false;
  return n.startsWith("pije") || n.includes("alkool") || n.includes("alkoolike");
}

function isFoodCategory(category) {
  const n = normCat(category);
  if (!n) return false;
  return !isDrinkCategory(n);
}

module.exports = {
  normCat,
  isDrinkCategory,
  isFoodCategory,
};
