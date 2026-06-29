import { getLang } from "../lib/i18n.js";
import { sqContent } from "./content/sq/index.js";
import { enContent } from "./content/en/index.js";

export const articlesMeta = [
  {
    slug: "stoku-faturat-dhe-skanimi-me-ai",
    variant: "dashboard",
    sq: {
      category: "MENAXHIM",
      title: "Stoku, Faturat dhe Skanimi me AI: Kontroll më i Lehtë për Restorantin",
      date: "06 maj 2026",
    },
    en: {
      category: "MANAGEMENT",
      title: "Inventory, Invoices & AI Scanning: Easier Control for Your Restaurant",
      date: "06 May 2026",
    },
  },
  {
    slug: "aplikacion-offline-me-sync",
    variant: "mobile",
    sq: {
      category: "POS & TEKNOLOGJI",
      title: "Aplikacion Offline me Sync për Restorante",
      date: "06 maj 2026",
    },
    en: {
      category: "POS & TECHNOLOGY",
      title: "Offline App with Sync for Restaurants",
      date: "06 May 2026",
    },
  },
  {
    slug: "program-pos-falas",
    variant: "pos",
    sq: {
      category: "POS & TEKNOLOGJI",
      title: "Program POS Falas për Restorante",
      date: "06 maj 2026",
    },
    en: {
      category: "POS & TECHNOLOGY",
      title: "Free POS Software for Restaurants",
      date: "06 May 2026",
    },
  },
  {
    slug: "5-arsye-pos",
    variant: "analytics",
    sq: {
      category: "MENAXHIM",
      title: "5 Arsye pse çdo restorant ka nevojë për POS",
      date: "05 maj 2026",
    },
    en: {
      category: "MANAGEMENT",
      title: "5 Reasons Every Restaurant Needs a POS System",
      date: "05 May 2026",
    },
  },
  {
    slug: "porosite-klienteve",
    variant: "mobile",
    sq: {
      category: "FUNKSIONALITETE",
      title: "Porositë e Klientëve: Klientët porosisin direkt nga telefoni",
      date: "04 maj 2026",
    },
    en: {
      category: "FEATURES",
      title: "Customer Orders: Guests Order Directly from Their Phone",
      date: "04 May 2026",
    },
  },
  {
    slug: "meny-digjitale-qr",
    variant: "qr",
    sq: {
      category: "TEKNOLOGJI",
      title: "Meny Digjitale me QR Code",
      date: "03 maj 2026",
    },
    en: {
      category: "TECHNOLOGY",
      title: "Digital Menu with QR Code",
      date: "03 May 2026",
    },
  },
  {
    slug: "skanoni-menyne-me-ai",
    variant: "scan",
    sq: {
      category: "TEKNOLOGJI",
      title: "Skanoni Menunë me AI: Shtoni 50 Produkte në 2 Minuta",
      date: "28 mars 2026",
    },
    en: {
      category: "TECHNOLOGY",
      title: "Scan Your Menu with AI: Add 50 Products in 2 Minutes",
      date: "28 March 2026",
    },
  },
  {
    slug: "stoku-menaxhimi-inventarit",
    variant: "dashboard",
    sq: {
      category: "MENAXHIM",
      title: "Stoku: Si të Menaxhoni Inventarin e Restorantit pa Humbje",
      date: "28 mars 2026",
    },
    en: {
      category: "MANAGEMENT",
      title: "Inventory: How to Manage Restaurant Stock Without Losses",
      date: "28 March 2026",
    },
  },
  {
    slug: "zbritjet-ne-restorante",
    variant: "pos",
    sq: {
      category: "MENAXHIM",
      title: "Zbritjet në Restorante: Si të Rrisni Shitjet me Oferta të Zgjuara",
      date: "28 mars 2026",
    },
    en: {
      category: "MANAGEMENT",
      title: "Restaurant Discounts: Grow Sales with Smart Offers",
      date: "28 March 2026",
    },
  },
  {
    slug: "analitika-ne-restorante",
    variant: "analytics",
    sq: {
      category: "ANALITIKË",
      title: "Analitika në Restorante: Nga të Dhënat te Vendime më të Mira",
      date: "27 mars 2026",
    },
    en: {
      category: "ANALYTICS",
      title: "Restaurant Analytics: From Data to Better Decisions",
      date: "27 March 2026",
    },
  },
  {
    slug: "bashko-tavolina",
    variant: "tables",
    sq: {
      category: "VEÇORI",
      title: "Bashko Tavolina: Si të Kombinosh Porositë pa Ndërprerje",
      date: "27 mars 2026",
    },
    en: {
      category: "FEATURES",
      title: "Merge Tables: Combine Orders Without Disruption",
      date: "27 March 2026",
    },
  },
  {
    slug: "identifikim-stafi",
    variant: "login",
    sq: {
      category: "VEÇORI",
      title: "Identifikim Stafi: PIN, RFID apo Fjalëkalim — Cila Metodë për Çfarë?",
      date: "27 mars 2026",
    },
    en: {
      category: "FEATURES",
      title: "Staff Login: PIN, RFID or Password — Which Method for What?",
      date: "27 March 2026",
    },
  },
  {
    slug: "raportet-e-restorantit",
    variant: "dashboard",
    sq: {
      category: "MENAXHIM",
      title: "Raportet e Restorantit: Si të Kuptosh Biznesin Tënd me Numra",
      date: "27 mars 2026",
    },
    en: {
      category: "MANAGEMENT",
      title: "Restaurant Reports: Understand Your Business by the Numbers",
      date: "27 March 2026",
    },
  },
];

function getContentMap(lang) {
  return lang === "en" ? enContent : sqContent;
}

function localizeArticle(meta, lang) {
  const locale = meta[lang] ?? meta.sq;
  const content = getContentMap(lang)[meta.slug];
  if (!content) return null;
  return {
    slug: meta.slug,
    variant: meta.variant,
    category: locale.category,
    title: locale.title,
    date: locale.date,
    content,
  };
}

export function getArticleBySlug(slug, lang = getLang()) {
  const meta = articlesMeta.find((item) => item.slug === slug);
  if (!meta) return null;
  return localizeArticle(meta, lang);
}

export function getAllArticles(lang = getLang()) {
  return articlesMeta.map((meta) => localizeArticle(meta, lang)).filter(Boolean);
}
