import { ui } from "../data/i18n.js";
import { siteStrings } from "../data/siteStrings.js";

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
  return ui[lang]?.[key] ?? siteStrings[lang]?.[key] ?? ui.sq[key] ?? siteStrings.sq[key] ?? key;
}

document.documentElement.lang = lang === "en" ? "en" : "sq";
