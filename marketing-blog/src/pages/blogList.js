import { renderHeader, renderBackToTop, bindBackToTop, bindLangSwitch } from "../components/layout.js";
import { getAllArticles } from "../data/articles.js";
import { renderArticleImage, heroImage } from "../lib/images.js";
import { t } from "../lib/i18n.js";
import { ui } from "../data/i18n.js";
import { getLang } from "../lib/i18n.js";
import { blogArticlePath } from "../lib/base.js";

export function renderBlogList() {
  const articles = getAllArticles();
  const lang = getLang();

  document.title = t("pageTitle");
  document.querySelector('meta[name="description"]')?.setAttribute("content", ui[lang].metaDescription);

  document.getElementById("app").innerHTML = `
    ${renderHeader({ activeNav: "blog" })}
    <main>
      <section class="hero hero-with-image" style="--hero-image: url('${heroImage}')">
        <div class="hero-overlay"></div>
        <div class="container hero-content">
          <div class="hero-badge">
            <span aria-hidden="true">📘</span>
            ${t("blogBadge")}
          </div>
          <h1>
            ${t("heroTitle")}<br />
            <span class="accent">${t("heroAccent")}</span>
          </h1>
          <p>${t("heroSubtitle")}</p>
        </div>
      </section>

      <section class="articles">
        <div class="container">
          <div class="article-grid">
            ${articles
              .map(
                (article) => `
                  <a class="article-card" href="${blogArticlePath(article.slug)}" data-navigate>
                    <div class="article-thumb">
                      ${renderArticleImage(article.slug, { alt: article.title })}
                    </div>
                    <div class="article-body">
                      <div class="article-category">${article.category}</div>
                      <h2 class="article-title">${article.title}</h2>
                      <div class="article-footer">
                        <span class="article-date">${article.date}</span>
                        <span class="article-link">${t("readMore")}</span>
                      </div>
                    </div>
                  </a>
                `
              )
              .join("")}
          </div>
        </div>
      </section>
    </main>
    ${renderBackToTop()}
  `;

  bindBackToTop();
  bindLangSwitch();
  window.scrollTo(0, 0);
}
