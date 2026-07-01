import {
  renderHeader,
  renderFooter,
  renderBackToTop,
  bindBackToTop,
  bindLangSwitch,
  bindMobileNav,
  bindFooterContact,
} from "../components/layout.js";
import { getAllArticles } from "../data/articles.js";
import { renderArticleImage, heroImage } from "../lib/images.js";
import { t } from "../lib/i18n.js";
import { siteStrings } from "../data/siteStrings.js";
import { getLang } from "../lib/i18n.js";
import { assetPath, blogArticlePath } from "../lib/base.js";

const PACKAGE_PLANS = ["p1", "p2", "p3", "p4"];
const PACKAGE_DETAIL_KEYS = {
  p1: ["incl", "f1", "f2", "f3", "f4", "f5", "f6"],
  p2: ["incl", "f1", "f2", "f3", "f4", "f5", "f6"],
  p3: ["incl", "f1", "f2", "f3", "f4", "f5", "f6"],
  p4: ["incl", "f1", "f2", "f3", "f4", "f5", "f6"],
};
const PACKAGE_CARD_KEYS = {
  p1: ["incl", "f1", "f2", "f3", "f4"],
  p2: ["incl", "f1", "f2", "f3", "f4"],
  p3: ["incl", "f1", "f2", "f3", "f4"],
  p4: ["incl", "f1", "f2", "f3", "f4"],
};

function packageFeaturesHtml(plan, { keys } = {}) {
  const prefix = `packages.${plan}`;
  const featureKeys = keys ?? PACKAGE_DETAIL_KEYS[plan] ?? [];
  return featureKeys
    .map((f) => t(`${prefix}.${f}`))
    .filter(Boolean)
    .map((line) => `<li>${line}</li>`)
    .join("");
}

function packageCard(plan) {
  const prefix = `packages.${plan}`;
  const tagline = t(`${prefix}.tagline`);
  const name = t(`${prefix}.name`);
  return `
    <article
      class="package-card"
      data-package="${plan}"
      role="button"
      tabindex="0"
      aria-pressed="false"
      aria-label="${name}"
    >
      <div class="package-card-thumb" aria-hidden="true">${name.charAt(0)}</div>
      <span class="package-badge">${t("packages.badge")}</span>
      <div class="package-card-body">
        <h3 class="package-name">${name}</h3>
        ${tagline ? `<p class="package-tagline">${tagline}</p>` : ""}
        <ul class="package-list">${packageFeaturesHtml(plan, { keys: PACKAGE_CARD_KEYS[plan] })}</ul>
        <span class="btn btn-ghost package-select-btn">${t("cta.choosePackage")}</span>
      </div>
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
      <div class="how-card-body">
        <h3>${title}</h3>
        <div class="how-card-desc-wrap">
          <p class="how-card-desc">${t(descKey)}</p>
        </div>
        <a class="how-card-link" href="${manualHref}">${t("how.readManual")}</a>
      </div>
    </article>
  `;
}

function spotlightVisual(variant) {
  if (variant === "ai") {
    return `
      <div class="spotlight-mock spotlight-mock-ai" aria-hidden="true">
        <div class="sm-top">
          <span class="sm-dot"></span><span class="sm-dot"></span><span class="sm-dot"></span>
        </div>
        <div class="sm-kpis">
          <div class="sm-kpi"><strong>98%</strong><span>Stok OK</span></div>
          <div class="sm-kpi"><strong>Live</strong><span>Sync</span></div>
          <div class="sm-kpi"><strong>€</strong><span>Fatura</span></div>
        </div>
        <div class="sm-bars">
          <span style="--h:72%"></span><span style="--h:48%"></span><span style="--h:88%"></span><span style="--h:56%"></span>
        </div>
      </div>`;
  }
  return `
    <div class="spotlight-mock spotlight-mock-platform" aria-hidden="true">
      <div class="sm-phone">
        <div class="sm-phone-screen">
          <span class="sm-badge">/r/</span>
          <span class="sm-line"></span><span class="sm-line sm-short"></span>
          <div class="sm-grid-mini"><i></i><i></i><i></i><i></i></div>
        </div>
      </div>
      <div class="sm-phone sm-phone-alt">
        <div class="sm-phone-screen">
          <span class="sm-badge sm-badge-shop">/s/</span>
          <div class="sm-grid-mini sm-grid-shop"><i></i><i></i><i></i><i></i><i></i><i></i></div>
        </div>
      </div>
    </div>`;
}

function spotlightCard({ variant, categoryKey, titleKey, descKey, linkKey, href, imageSlug = "", hidePhoto = false }) {
  const imgBlock = imageSlug
    ? `<div class="spotlight-photo-fallback">${renderArticleImage(imageSlug, { className: "spotlight-img" })}</div>`
    : "";
  const photoBlock = hidePhoto
    ? ""
    : `
      <div class="spotlight-photo">
        ${spotlightVisual(variant)}
        ${imgBlock}
      </div>`;
  return `
    <a class="spotlight-card spotlight-card-${variant}${hidePhoto ? " spotlight-card--no-photo" : ""}" href="${href}" data-navigate>
      ${photoBlock}
      <div class="spotlight-body">
        <div class="spotlight-category">${t(categoryKey)}</div>
        <h3 class="spotlight-title">${t(titleKey)}</h3>
        <p class="spotlight-desc">${t(descKey)}</p>
        <span class="spotlight-link">${t(linkKey)}</span>
      </div>
    </a>
  `;
}

function bindCollapsibleCards() {
  const mq = window.matchMedia("(max-width: 640px)");

  document.querySelectorAll(".how-card").forEach((card) => {
    const wrap = card.querySelector(".how-card-desc-wrap");
    const desc = card.querySelector(".how-card-desc");
    if (!wrap || !desc) return;

    let btn = card.querySelector(".card-toggle[data-how-toggle]");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "card-toggle";
      btn.dataset.howToggle = "1";
      wrap.insertAdjacentElement("afterend", btn);
    }

    const sync = () => {
      const expanded = wrap.classList.contains("is-expanded");
      const needsToggle =
        mq.matches &&
        (expanded || desc.textContent.trim().length > 85);
      btn.hidden = !needsToggle;
      btn.setAttribute("aria-expanded", expanded ? "true" : "false");
      btn.textContent = expanded ? t("expand.less") : t("expand.more");
      if (!mq.matches) {
        wrap.classList.remove("is-expanded");
      }
    };

    btn.addEventListener("click", () => {
      wrap.classList.toggle("is-expanded");
      sync();
    });

    sync();
    mq.addEventListener("change", sync);
    window.addEventListener("resize", sync, { passive: true });
  });

  document.querySelectorAll(".package-card[data-package]").forEach((card) => {
    const list = card.querySelector(".package-list");
    if (!list) return;
    list.classList.add("package-list--foldable");

    let btn = card.querySelector(".card-toggle[data-package-toggle]");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "card-toggle";
      btn.dataset.packageToggle = "1";
      list.insertAdjacentElement("afterend", btn);
    }

    const sync = () => {
      const items = list.querySelectorAll("li");
      const expanded = list.classList.contains("is-expanded");
      const needsToggle = mq.matches && items.length > 3;
      btn.hidden = !needsToggle;
      btn.setAttribute("aria-expanded", expanded ? "true" : "false");
      btn.textContent = expanded ? t("expand.less") : t("expand.more");
      if (!mq.matches) {
        list.classList.remove("is-expanded");
      }
    };

    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      list.classList.toggle("is-expanded");
      sync();
    });

    sync();
    mq.addEventListener("change", sync);
  });
}

function bindPackageCards() {
  const cards = document.querySelectorAll(".package-card[data-package]");
  const detailPanel = document.getElementById("package-detail");
  const detailName = document.getElementById("package-detail-name");
  const detailSummary = document.getElementById("package-detail-summary");
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
    if (detailSummary) {
      const summary = t(`${prefix}.summary`);
      detailSummary.textContent = summary;
      detailSummary.hidden = !summary;
    }
    detailList.innerHTML = packageFeaturesHtml(plan, { keys: PACKAGE_DETAIL_KEYS[plan] });
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
    const pkg = document.getElementById("contact-package")?.value.trim();
    const subject = encodeURIComponent("Revolution Invest POS — provë falas");
    const body = encodeURIComponent(pkg ? `Pako: ${pkg}\n\n` : "");
    window.location.href = `mailto:${t("contact.email")}?subject=${subject}&body=${body}`;
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
            <a class="btn btn-hero-secondary" href="#veçorite">${t("hero.cta.secondary")}</a>
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

      <section class="site-section spotlight-section" id="veçorite">
        <div class="container">
          <div class="section-head">
            <h2>${t("spotlight.title")}</h2>
            <p>${t("spotlight.subtitle")}</p>
          </div>
          <div class="spotlight-grid spotlight-grid--single">
            ${spotlightCard({
              variant: "platform",
              categoryKey: "spotlight.card2.category",
              titleKey: "spotlight.card2.title",
              descKey: "spotlight.card2.desc",
              linkKey: "spotlight.card2.link",
              href: "#pakot",
            })}
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
            <p class="package-detail-summary" id="package-detail-summary" hidden></p>
            <p class="package-detail-label">${t("packages.includes")}</p>
            <ul class="package-detail-list" id="package-detail-list"></ul>
            <input type="hidden" id="contact-package" value="">
            <button class="btn btn-primary" type="button" id="package-detail-cta">${t("cta.choosePackage")}</button>
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
  bindFooterContact();
  bindPackageCards();
  bindCollapsibleCards();

  if (window.location.hash) {
    requestAnimationFrame(() => {
      document.querySelector(window.location.hash)?.scrollIntoView({ behavior: "smooth" });
    });
  } else {
    window.scrollTo(0, 0);
  }
}
