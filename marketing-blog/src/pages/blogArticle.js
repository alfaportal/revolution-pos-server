import { renderHeader, renderBackToTop, bindBackToTop, bindLangSwitch } from "../components/layout.js";
import { getArticleBySlug } from "../data/articles.js";
import { renderHome } from "./home.js";
import { renderArticleImage } from "../lib/images.js";
import { t } from "../lib/i18n.js";
import { siteRoot } from "../lib/base.js";

export function renderBlogArticle(slug) {
  const article = getArticleBySlug(slug);

  if (!article) {
    renderHome();
    return;
  }

  document.title = `${article.title} — Revolution POS`;
  document.getElementById("app").innerHTML = `
    ${renderHeader({ activeNav: "blog" })}
    <main class="article-page">
      <div class="container">
        <a class="article-back" href="${siteRoot()}" data-navigate>${t("backToBlog")}</a>

        <article class="article-full">
          <header class="article-full-header">
            <div class="article-category">${article.category}</div>
            <h1>${article.title}</h1>
            <time class="article-date" datetime="${article.date}">${article.date}</time>
          </header>

          <div class="article-full-image">
            ${renderArticleImage(article.slug, { alt: article.title, loading: "eager" })}
          </div>

          <div class="article-content">
            ${article.content}
          </div>
        </article>
      </div>
    </main>
    ${renderBackToTop()}
  `;

  bindBackToTop();
  bindLangSwitch();
  window.scrollTo(0, 0);
}
