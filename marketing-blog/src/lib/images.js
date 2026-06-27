import { assetPath } from "./base.js";

const DEFAULT_IMAGE = assetPath("images/articles/program-pos-falas.jpg");

export function getArticleImage(slug) {
  return assetPath(`images/articles/${slug}.jpg`);
}

export function renderArticleImage(slug, { alt = "", loading = "lazy", className = "article-photo" } = {}) {
  const safeAlt = alt.replace(/"/g, "&quot;");
  const src = getArticleImage(slug);

  return `<img src="${src}" alt="${safeAlt}" class="${className}" loading="${loading}" onerror="this.onerror=null;this.src='${DEFAULT_IMAGE}';" />`;
}

export const heroImage = assetPath("images/hero.jpg");
