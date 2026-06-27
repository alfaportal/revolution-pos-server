import { sqContent } from "./sq/index.js";
import { enContent } from "./en/index.js";

export function getArticleContent(slug, lang) {
  const map = lang === "en" ? enContent : sqContent;
  return map[slug] ?? null;
}
