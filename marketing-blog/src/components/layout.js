import { getLang, t, setLang } from "../lib/i18n.js";
import { resolveRoute } from "../lib/router.js";
import { blogRoot, siteRoot } from "../lib/base.js";
import { assetPath } from "../lib/base.js";

export function renderHeader({ activeNav = "blog" } = {}) {
  const lang = getLang();
  const items = [
    { id: "features", label: t("features"), href: `${siteRoot()}#features` },
    { id: "how-it-works", label: t("howItWorks"), href: `${siteRoot()}#how-it-works` },
    { id: "packages", label: t("packages"), href: `${siteRoot()}#pakot` },
    { id: "faq", label: t("faq"), href: `${siteRoot()}#faq` },
    { id: "blog", label: t("blog"), href: blogRoot() },
  ];

  return `
    <header class="site-header">
      <div class="container">
        <a class="brand" href="${siteRoot()}" data-navigate>
          <span class="brand-mark">
            <img src="${assetPath("logo-source.png")}" width="40" height="40" alt="" />
          </span>
          <span>Revolution</span>
        </a>

        <nav class="nav" aria-label="${t("navLabel")}">
          ${items
            .map(
              (item) =>
                `<a href="${item.href}" data-navigate class="${activeNav === item.id ? "active" : ""}">${item.label}</a>`
            )
            .join("")}
        </nav>

        <div class="lang-switch" aria-label="${t("langLabel")}">
          <button type="button" data-lang="sq" class="${lang === "sq" ? "active" : ""}">SQ</button>
          <button type="button" data-lang="en" class="${lang === "en" ? "active" : ""}">EN</button>
        </div>
      </div>
    </header>
  `;
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
