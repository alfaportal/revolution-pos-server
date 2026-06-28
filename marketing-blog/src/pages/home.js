import {
  renderHeader,
  renderFooter,
  renderBackToTop,
  bindBackToTop,
  bindLangSwitch,
  bindMobileNav,
  bindContactForm,
  bindFooterContact,
} from "../components/layout.js";
import { getAllArticles } from "../data/articles.js";
import { renderArticleImage, heroImage } from "../lib/images.js";
import { t } from "../lib/i18n.js";
import { siteStrings } from "../data/siteStrings.js";
import { getLang } from "../lib/i18n.js";
import { assetPath, blogArticlePath } from "../lib/base.js";

const PACKAGE_PLANS = ["p1", "p2", "p3", "p4"];
const PACKAGE_FEATURE_KEYS = {
  p1: ["f1", "f2", "f3", "f4"],
  p2: ["f1", "f2", "f3", "f4"],
  p3: ["f1", "f2", "f3", "f4"],
  p4: ["f1", "f2", "f3"],
};
const CARD_FEATURE_PREVIEW = 4;

function packageFeaturesHtml(plan, { limit } = {}) {
  const prefix = `packages.${plan}`;
  const keys = PACKAGE_FEATURE_KEYS[plan] ?? [];
  const visible = limit ? keys.slice(0, limit) : keys;
  return visible.map((f) => `<li>${t(`${prefix}.${f}`)}</li>`).join("");
}

function packageCard(plan) {
  const prefix = `packages.${plan}`;
  return `
    <article
      class="package-card"
      data-package="${plan}"
      role="button"
      tabindex="0"
      aria-pressed="false"
      aria-label="${t(`${prefix}.name`)}"
    >
      <span class="package-badge">${t("packages.badge")}</span>
      <h3 class="package-name">${t(`${prefix}.name`)}</h3>
      <ul class="package-list">${packageFeaturesHtml(plan, { limit: CARD_FEATURE_PREVIEW })}</ul>
      <span class="btn btn-ghost package-select-btn">${t("cta.choosePackage")}</span>
    </article>
  `;
}

function howCard(imagePath, titleKey, descKey, manualHref) {
  const title = t(titleKey);
  return `
    <article class="how-card">
      <div class="how-card-photo">
        <img src="${assetPath(imagePath)}" alt="${title}" loading="lazy" />
      </div>
      <h3>${title}</h3>
      <p>${t(descKey)}</p>
      <a class="how-card-link" href="${manualHref}">${t("how.readManual")}</a>
    </article>
  `;
}

function bindPackageCards() {
  const cards = document.querySelectorAll(".package-card[data-package]");
  const detailPanel = document.getElementById("package-detail");
  const detailName = document.getElementById("package-detail-name");
  const detailList = document.getElementById("package-detail-list");
  const packageField = document.getElementById("contact-package");
  if (!cards.length || !detailPanel) return;

  const selectPackage = (plan) => {
    const prefix = `packages.${plan}`;

    cards.forEach((card) => {
      const selected = card.dataset.package === plan;
      card.classList.toggle("selected", selected);
      card.setAttribute("aria-pressed", selected ? "true" : "false");
    });

    detailName.textContent = t(`${prefix}.name`);
    detailList.innerHTML = packageFeaturesHtml(plan);
    detailPanel.hidden = false;

    if (packageField) {
      packageField.value = t(`${prefix}.name`);
    }

    sessionStorage.setItem("selectedPackage", plan);
  };

  cards.forEach((card) => {
    const plan = card.dataset.package;
    const activate = (event) => {
      if (event?.target?.closest(".how-card-link")) return;
      selectPackage(plan);
    };

    card.addEventListener("click", activate);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectPackage(plan);
      }
    });
  });

  document.getElementById("package-detail-cta")?.addEventListener("click", () => {
    document.getElementById("kontakt")?.scrollIntoView({ behavior: "smooth" });
    document.getElementById("contact-message")?.focus();
  });

  const saved = sessionStorage.getItem("selectedPackage");
  if (saved && PACKAGE_PLANS.includes(saved)) {
    selectPackage(saved);
  }
}

export function renderHome() {
  const articles = getAllArticles();
  const lang = getLang();

  document.title = t("meta.title");
  document.querySelector('meta[name="description"]')?.setAttribute(
    "content",
    siteStrings[lang]?.["meta.description"] ?? siteStrings.sq["meta.description"]
  );

  document.getElementById("app").innerHTML = `
    ${renderHeader({ activeNav: "home" })}
    <main>
      <section class="hero hero-with-image hero-home" id="ballina" style="--hero-image: url('${heroImage}')">
        <div class="hero-overlay hero-overlay-dark"></div>
        <div class="container hero-content hero-home-content">
          <div class="hero-badge hero-home-badge">
            <span aria-hidden="true">🔥</span>
            ${t("hero.badge")}
          </div>
          <h1>${t("hero.title")}</h1>
          <p class="hero-home-subtitle">${t("hero.subtitle")}</p>
          <div class="hero-actions">
            <a class="btn btn-hero-primary" href="#kontakt">${t("hero.cta.primary")}</a>
            <a class="btn btn-hero-secondary" href="#si-funksionon">${t("hero.cta.secondary")}</a>
          </div>
          <div class="hero-stats" aria-label="Statistika">
            <span>${t("hero.stats.restaurants")}</span>
            <span class="hero-stats-sep" aria-hidden="true">·</span>
            <span>${t("hero.stats.support")}</span>
            <span class="hero-stats-sep" aria-hidden="true">·</span>
            <span>${t("hero.stats.cloud")}</span>
          </div>
        </div>
      </section>

      <section class="articles" id="artikuj">
        <div class="container">
          <div class="section-head">
            <h2>${t("articles.heading")}</h2>
          </div>
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

      <section class="site-section" id="si-funksionon">
        <div class="container">
          <div class="section-head">
            <h2>${t("how.title")}</h2>
            <p>${t("how.subtitle")}</p>
          </div>
          <div class="how-grid">
            ${howCard("images/modules/pos-kasa.jpg", "how.pos.title", "how.pos.desc", "/website/manual.html#menuja")}
            ${howCard("images/modules/kamarieri.jpg", "how.waiter.title", "how.waiter.desc", "/website/manual.html#kamarieri")}
            ${howCard("images/modules/kds-kuzhina.jpg", "how.kds.title", "how.kds.desc", "/website/manual.html#kuzhina")}
            ${howCard("images/modules/pronari.jpg", "how.owner.title", "how.owner.desc", "/website/manual.html#hyrja")}
          </div>
        </div>
      </section>

      <section class="site-section site-section-muted" id="pakot">
        <div class="container">
          <div class="section-head">
            <h2>${t("packages.title")}</h2>
            <p>${t("packages.subtitle")}</p>
            <p class="packages-hint">${t("packages.clickHint")}</p>
          </div>
          <div class="packages-grid">
            ${packageCard("p1")}
            ${packageCard("p2")}
            ${packageCard("p3")}
            ${packageCard("p4")}
          </div>
          <div class="package-detail-panel" id="package-detail" hidden>
            <div class="package-detail-head">
              <span class="package-detail-badge">${t("packages.selected")}</span>
              <h3 id="package-detail-name"></h3>
            </div>
            <p class="package-detail-label">${t("packages.includes")}</p>
            <ul class="package-detail-list" id="package-detail-list"></ul>
            <button class="btn btn-primary" type="button" id="package-detail-cta">${t("cta.choosePackage")}</button>
          </div>
        </div>
      </section>

      <section class="site-section" id="kontakt">
        <div class="container">
          <div class="section-head">
            <h2>${t("contact.title")}</h2>
            <p>${t("contact.subtitle")}</p>
          </div>
          <div class="contact-grid">
            <div class="contact-card">
              <h3>${t("contact.direct")}</h3>
              <div class="contact-links">
                <a class="contact-link whatsapp" id="contact-whatsapp" href="#" target="_blank" rel="noopener noreferrer">
                  <span aria-hidden="true">💬</span>
                  <span id="contact-whatsapp-label">WhatsApp</span>
                </a>
                <a class="contact-link" id="contact-tel" href="#">
                  <span aria-hidden="true">📞</span>
                  <span id="contact-tel-label">+383 44 123 456</span>
                </a>
                <a class="contact-link" href="mailto:info@revolution-pos.com">
                  <span aria-hidden="true">✉️</span>
                  <span>info@revolution-pos.com</span>
                </a>
              </div>
            </div>
            <div class="contact-card">
              <h3>${t("contact.sendMessage")}</h3>
              <form class="contact-form" id="contact-form">
                <input type="hidden" id="contact-package" name="package" value="">
                <div class="field">
                  <label for="contact-name">${t("form.name")}</label>
                  <input type="text" id="contact-name" name="name" required placeholder="${t("form.namePlaceholder")}">
                </div>
                <div class="field">
                  <label for="contact-phone">${t("form.phone")}</label>
                  <input type="tel" id="contact-phone" name="phone" required placeholder="+383 44 123 456">
                </div>
                <div class="field">
                  <label for="contact-message">${t("form.message")}</label>
                  <textarea id="contact-message" name="message" required placeholder="${t("form.messagePlaceholder")}"></textarea>
                </div>
                <button class="btn btn-primary" type="submit">${t("cta.sendRequest")}</button>
                <p class="form-msg" id="form-msg" role="status"></p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
    ${renderFooter()}
    ${renderBackToTop()}
  `;

  bindBackToTop();
  bindLangSwitch();
  bindMobileNav();
  bindContactForm();
  bindFooterContact();
  bindPackageCards();

  if (window.location.hash) {
    requestAnimationFrame(() => {
      document.querySelector(window.location.hash)?.scrollIntoView({ behavior: "smooth" });
    });
  } else {
    window.scrollTo(0, 0);
  }
}
