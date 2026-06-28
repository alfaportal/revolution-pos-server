import {
  renderHeader,
  renderFooter,
  renderBackToTop,
  bindBackToTop,
  bindLangSwitch,
  bindMobileNav,
  bindFooterContact,
} from "../components/layout.js";
import { getLegalPage } from "../data/legalContent.js";
import { renderHome } from "./home.js";
import { t } from "../lib/i18n.js";
import { siteRoot } from "../lib/base.js";

export function renderLegalPage(slug) {
  const page = getLegalPage(slug);
  if (!page) {
    renderHome();
    return;
  }

  document.title = `${page.title} — Revolution Invest POS`;
  document.getElementById("app").innerHTML = `
    ${renderHeader({ activeNav: "home" })}
    <main class="legal-page">
      <div class="container">
        <a class="article-back" href="${siteRoot()}" data-navigate>${t("legal.backHome")}</a>
        <article class="legal-doc">
          <header class="legal-doc-header">
            <p class="legal-doc-meta">${page.updated}</p>
            <h1>${page.title}</h1>
          </header>
          <div class="legal-doc-body article-content">
            ${page.content}
          </div>
        </article>
      </div>
    </main>
    ${renderFooter()}
    ${renderBackToTop()}
  `;

  bindBackToTop();
  bindLangSwitch();
  bindMobileNav();
  bindFooterContact();
  window.scrollTo(0, 0);
}
