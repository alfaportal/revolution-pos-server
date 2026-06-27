import { ui } from "../data/i18n.js";

const STORAGE_KEY = "revolution-pos-lang";

let lang = localStorage.getItem(STORAGE_KEY) || "sq";
let onChange = null;

export function getLang() {
  return lang;
}

export function setLang(nextLang) {
  if (nextLang !== "sq" && nextLang !== "en") return;
  lang = nextLang;
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.lang = lang === "en" ? "en" : "sq";
  onChange?.();
}

export function onLangChange(callback) {
  onChange = callback;
}

export function t(key) {
  return ui[lang]?.[key] ?? ui.sq[key] ?? key;
}

document.documentElement.lang = lang === "en" ? "en" : "sq";
