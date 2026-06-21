const crypto = require("crypto");

function slugify(text) {
  return (
    String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "klient"
  );
}

function randomKitchenKey() {
  return crypto.randomBytes(16).toString("hex");
}

module.exports = { slugify, randomKitchenKey };
