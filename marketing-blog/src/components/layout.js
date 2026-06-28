import { getLang, t, setLang } from "../lib/i18n.js";
import { resolveRoute, getCurrentPath } from "../lib/router.js";
import { siteRoot, assetPath } from "../lib/base.js";

function sectionHref(id) {
  return getCurrentPath() === "/" ? `#${id}` : `/#${id}`;
}

function sectionLink(id, label, activeNav, navId) {
  const onHome = getCurrentPath() === "/";
  const href = sectionHref(id);
  const attrs = onHome ? "" : ' data-navigate';
  return `<a href="${href}"${attrs} class="${activeNav === navId ? "active" : ""}">${label}</a>`;
}

export function renderHeader({ activeNav = "home" } = {}) {
  const lang = getLang();
  const items = [
    { id: "home", label: t("nav.home"), section: "ballina" },
    { id: "how-it-works", label: t("nav.howItWorks"), section: "si-funksionon" },
    { id: "packages", label: t("nav.packages"), section: "pakot" },
    { id: "blog", label: t("nav.blog"), section: "artikuj" },
  ];

  return `
    <header class="site-header">
      <div class="container header-inner">
        <a class="brand" href="${siteRoot()}" ${getCurrentPath() === "/" ? "" : 'data-navigate'} aria-label="Revolution Invest POS">
          <span class="brand-mark" aria-hidden="true">
            <img src="${assetPath("logo-source.png")}" width="40" height="40" alt="" />
          </span>
          <span class="brand-text">
            Revolution Invest POS
            <small>${t("brand.subtitle")}</small>
          </span>
        </a>

        <nav class="nav nav-desktop" aria-label="${t("navLabel")}">
          ${items.map((item) => sectionLink(item.section, item.label, activeNav, item.id)).join("")}
          <a href="/website/manual.html">${t("nav.manual")}</a>
          ${sectionLink("kontakt", t("nav.contact"), activeNav, "contact")}
        </nav>

        <div class="header-actions">
          <div class="lang-switch" aria-label="${t("langLabel")}">
            <button type="button" data-lang="sq" class="${lang === "sq" ? "active" : ""}">SQ</button>
            <button type="button" data-lang="en" class="${lang === "en" ? "active" : ""}">EN</button>
          </div>
          <a class="btn btn-primary header-cta-desktop" href="${sectionHref("kontakt")}">${t("cta.startFree")}</a>
          <button class="menu-toggle" id="menu-toggle" type="button" aria-expanded="false" aria-controls="nav-mobile" aria-label="${t("nav.openMenu")}">☰</button>
        </div>
      </div>

      <nav class="nav-mobile" id="nav-mobile" aria-label="${t("navLabel")}">
        ${items.map((item) => sectionLink(item.section, item.label, activeNav, item.id)).join("")}
        <a href="/website/manual.html">${t("nav.manual")}</a>
        ${sectionLink("kontakt", t("nav.contact"), activeNav, "contact")}
        <a class="btn btn-primary" href="${sectionHref("kontakt")}">${t("cta.startFree")}</a>
      </nav>
    </header>
  `;
}

function footerSectionLink(section, label) {
  const onHome = getCurrentPath() === "/";
  const href = onHome ? `#${section}` : `/#${section}`;
  return `<li><a href="${href}"${onHome ? "" : ' data-navigate'}>${label}</a></li>`;
}

export function renderFooter() {
  const onHome = getCurrentPath() === "/";
  const homeAttrs = onHome ? "" : ' data-navigate';

  return `
    <footer class="site-footer">
      <div class="container footer-grid">
        <div class="footer-brand">
          <a class="footer-logo" href="${siteRoot()}"${homeAttrs} aria-label="Revolution Invest POS">
            <span class="brand-mark" aria-hidden="true">
              <img src="${assetPath("logo-source.png")}" width="40" height="40" alt="" />
            </span>
            <span class="footer-logo-text">Revolution Invest POS</span>
          </a>
          <p class="footer-tagline">${t("footer.tagline")}</p>
          <p class="footer-note">${t("footer.note")}</p>
        </div>

        <div class="footer-col">
          <h4>${t("footer.col.platform")}</h4>
          <ul>
            ${footerSectionLink("si-funksionon", t("footer.link.howItWorks"))}
            ${footerSectionLink("pakot", t("footer.link.packages"))}
            ${footerSectionLink("artikuj", t("footer.link.blog"))}
            <li><a href="/website/manual.html">${t("footer.link.manual")}</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>${t("footer.col.support")}</h4>
          <ul>
            ${footerSectionLink("kontakt", t("footer.link.contact"))}
            ${footerSectionLink("kontakt", t("footer.link.trial"))}
            <li><a href="/owner/login">${t("footer.link.login")}</a></li>
            <li><a id="footer-whatsapp" href="#" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
            <li><a href="mailto:info@revolution-pos.com">info@revolution-pos.com</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="container footer-bottom-inner">
          <p class="footer-copy">© ${new Date().getFullYear()} ${t("footer.rights")}</p>
          <p class="footer-legal-notice">${t("footer.legal.notice")}</p>
          <div class="footer-legal-links">
            <a href="/privacy" data-navigate>${t("footer.legal.privacy")}</a>
            <span aria-hidden="true">·</span>
            <a href="/terms" data-navigate>${t("footer.legal.terms")}</a>
          </div>
        </div>
      </div>
    </footer>
  `;
}

export function bindFooterContact() {
  const waLink = document.getElementById("footer-whatsapp");
  if (!waLink) return;

  async function loadFooterConfig() {
    try {
      const res = await fetch("/api/public/config");
      const data = await res.json();
      if (!res.ok || !data.ok) return;
      const phone = data.support_phone || "+383 44 123 456";
      const digits = data.support_phone_digits || "38344123456";
      waLink.textContent = `WhatsApp — ${phone}`;
      waLink.href = `https://wa.me/${digits}?text=${encodeURIComponent(t("wa.trial"))}`;
    } catch {
      waLink.textContent = "WhatsApp";
      waLink.href = `https://wa.me/38344123456?text=${encodeURIComponent(t("wa.trial"))}`;
    }
  }

  loadFooterConfig();
}

export function renderBackToTop() {
  return `<button id="back-to-top" class="back-to-top" type="button" aria-label="${t("backToTop")}">↑</button>`;
}

export function bindBackToTop() {
  const backToTop = document.querySelector("#back-to-top");
  if (!backToTop) return;

  const onScroll = () => {
    backToTop.classList.toggle("visible", window.scrollY > 400);
  };

  window.removeEventListener("scroll", onScroll);
  window.addEventListener("scroll", onScroll);
  onScroll();

  backToTop.onclick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
}

export function bindLangSwitch() {
  document.querySelectorAll(".lang-switch button[data-lang]").forEach((button) => {
    button.onclick = () => {
      const nextLang = button.dataset.lang;
      if (nextLang === getLang()) return;
      setLang(nextLang);
      resolveRoute();
    };
  });
}

export function bindMobileNav() {
  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("nav-mobile");
  toggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => nav.classList.remove("open"));
  });
}

export function bindContactForm() {
  const form = document.getElementById("contact-form");
  const formMsg = document.getElementById("form-msg");
  if (!form) return;

  let waDigits = "38344123456";
  let supportPhone = "+383 44 123 456";

  async function loadSiteConfig() {
    try {
      const res = await fetch("/api/public/config");
      const data = await res.json();
      if (!res.ok || !data.ok) return;
      if (data.support_phone) supportPhone = data.support_phone;
      if (data.support_phone_digits) waDigits = data.support_phone_digits;
      const waLabel = document.getElementById("contact-whatsapp-label");
      const telLabel = document.getElementById("contact-tel-label");
      const telLink = document.getElementById("contact-tel");
      const waLink = document.getElementById("contact-whatsapp");
      const phoneInput = document.getElementById("contact-phone");
      if (waLabel) waLabel.textContent = `WhatsApp — ${supportPhone}`;
      if (telLabel) telLabel.textContent = supportPhone;
      if (telLink) telLink.href = `tel:${supportPhone.replace(/\s/g, "")}`;
      if (phoneInput) phoneInput.placeholder = supportPhone;
      if (waLink) {
        waLink.href = `https://wa.me/${waDigits}?text=${encodeURIComponent(t("wa.trial"))}`;
      }
    } catch {
      /* defaults */
    }
  }

  loadSiteConfig();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("contact-name").value.trim();
    const phone = document.getElementById("contact-phone").value.trim();
    const message = document.getElementById("contact-message").value.trim();
    const packageChoice = document.getElementById("contact-package")?.value.trim() || "";
    if (!name || !phone || !message) {
      formMsg.textContent = t("form.error");
      formMsg.className = "form-msg err";
      return;
    }
    const intro = t("wa.formIntro").replace("{name}", name).replace("{phone}", phone);
    const packageLine = packageChoice ? `\n\nPako: ${packageChoice}` : "";
    const text = encodeURIComponent(`${intro}${packageLine}\n\n${message}\n\n${t("wa.formSuffix")}`);
    window.open(`https://wa.me/${waDigits}?text=${text}`, "_blank", "noopener,noreferrer");
    formMsg.textContent = t("form.success");
    formMsg.className = "form-msg ok";
    form.reset();
  });
}
