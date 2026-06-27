import { renderHeader, renderFooter, renderBackToTop, bindBackToTop, bindLangSwitch, bindMobileNav, bindContactForm } from "../components/layout.js";
import { getAllArticles } from "../data/articles.js";
import { renderArticleImage, heroImage } from "../lib/images.js";
import { t } from "../lib/i18n.js";
import { siteStrings } from "../data/siteStrings.js";
import { getLang } from "../lib/i18n.js";
import { blogArticlePath } from "../lib/base.js";

function packageCard(plan, price, featured = false) {
  const prefix = `packages.${plan}`;
  const features = ["f1", "f2", "f3", "f4"]
    .map((f) => `<li>${t(`${prefix}.${f}`)}</li>`)
    .join("");
  return `
    <article class="package-card${featured ? " featured" : ""}">
      <span class="package-badge">${t("packages.badge")}</span>
      <h3 class="package-name">${t(`${prefix}.name`)}</h3>
      <div class="package-price">${price}<small>${t("packages.perWeek")}</small></div>
      <ul class="package-list">${features}</ul>
      <a class="btn ${featured ? "btn-primary" : "btn-ghost"}" href="#kontakt">${t("cta.choosePackage")}</a>
    </article>
  `;
}

function howCard(icon, titleKey, descKey, manualHref) {
  return `
    <article class="how-card">
      <div class="how-card-icon" aria-hidden="true">${icon}</div>
      <h3>${t(titleKey)}</h3>
      <p>${t(descKey)}</p>
      <a class="how-card-link" href="${manualHref}">${t("how.readManual")}</a>
    </article>
  `;
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
      <section class="hero hero-with-image" id="ballina" style="--hero-image: url('${heroImage}')">
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

      <section class="site-section" id="si-funksionon">
        <div class="container">
          <div class="section-head">
            <h2>${t("how.title")}</h2>
            <p>${t("how.subtitle")}</p>
          </div>
          <div class="how-grid">
            ${howCard("🖥️", "how.pos.title", "how.pos.desc", "/website/manual.html#menuja")}
            ${howCard("📱", "how.waiter.title", "how.waiter.desc", "/website/manual.html#kamarieri")}
            ${howCard("🍳", "how.kds.title", "how.kds.desc", "/website/manual.html#kuzhina")}
            ${howCard("👤", "how.owner.title", "how.owner.desc", "/website/manual.html#hyrja")}
          </div>
        </div>
      </section>

      <section class="site-section site-section-muted" id="pakot">
        <div class="container">
          <div class="section-head">
            <h2>${t("packages.title")}</h2>
            <p>${t("packages.subtitle")}</p>
          </div>
          <div class="packages-grid">
            ${packageCard("p1", "10€")}
            ${packageCard("p2", "15€", true)}
            ${packageCard("p3", "20€")}
            ${packageCard("p4", "25€")}
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

  if (window.location.hash) {
    requestAnimationFrame(() => {
      document.querySelector(window.location.hash)?.scrollIntoView({ behavior: "smooth" });
    });
  } else {
    window.scrollTo(0, 0);
  }
}
