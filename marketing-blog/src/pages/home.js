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
        <span class="btn btn-ghost package-select-btn">${plan === "p4" ? t("cta.contactAi") : t("cta.buyPackage")}</span>
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

function bindStripeConfigAndPaymentBanner() {
  fetch("/api/public/config")
    .then((r) => r.json())
    .then((data) => {
      if (data?.ok && data.stripe_enabled) window.__stripeEnabled = true;
    })
    .catch(() => {});

  const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
  const payment = params.get("payment");
  const sessionId = params.get("session_id");
  if (payment === "success") {
    const note = document.querySelector(".get-started-note");
    if (note) {
      note.textContent = t("checkout.success");
      note.style.color = "#15803d";
    }
    if (sessionId && sessionId.startsWith("cs_")) {
      fetch("/api/payments/confirm-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      }).catch(() => {});
    }
  }
}

function setupDownloadHref(plan) {
  const p = plan && PACKAGE_PLANS.includes(plan) ? plan : "";
  return p ? `/api/public/setup-download?plan=${encodeURIComponent(p)}` : "/api/public/setup-download";
}

function bindGetStartedDownload() {
  const dl = document.getElementById("get-started-download");
  const help = document.getElementById("get-started-wa");
  if (dl) {
    dl.href = setupDownloadHref(sessionStorage.getItem("selectedPackage") || "p1");
  }
  if (!help) return;
  (async () => {
    try {
      const res = await fetch("/api/public/config");
      const data = await res.json();
      if (!res.ok || !data.ok) return;
      const digits = data.support_phone_digits || "38348707880";
      const text = encodeURIComponent(
        getLang() === "en"
          ? "Hello, I downloaded Setup — I need a trial / license key."
          : "Përshëndetje, shkarkova Setup — më duhet çelës trial / licencë.",
      );
      help.href = `https://wa.me/${digits}?text=${text}`;
      if (data.setup_download_url && dl && !sessionStorage.getItem("selectedPackage")) {
        dl.href = data.setup_download_url;
      }
    } catch {
      /* keep default */
    }
  })();
}

function bindPaymentSection() {
  const stripeBtn = document.getElementById("pay-stripe-cta");
  const bankBtns = document.querySelectorAll("[data-pay-bank]");
  bankBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      bankBtns.forEach((b) => b.classList.remove("is-selected"));
      btn.classList.add("is-selected");
      const hint = document.getElementById("pay-hint");
      const bankKey = btn.dataset.payBank || "raiffeisen";
      const plan = sessionStorage.getItem("selectedPackage") || "";
      if (plan === "p4") {
        if (hint) {
          hint.hidden = false;
          hint.textContent = t("packages.p4.summary");
        }
        return;
      }
      if (plan === "p1" || plan === "p2" || plan === "p3") {
        openBankTransferModal(plan, bankKey);
        return;
      }
      if (hint) {
        hint.hidden = false;
        hint.textContent = t("pay.pickPlan");
      }
      document.getElementById("pakot")?.scrollIntoView({ behavior: "smooth" });
    });
  });
  stripeBtn?.addEventListener("click", () => {
    const plan = sessionStorage.getItem("selectedPackage") || "";
    const hint = document.getElementById("pay-hint");
    if (plan === "p4") {
      if (hint) {
        hint.hidden = false;
        hint.textContent = t("packages.p4.summary");
      }
      return;
    }
    if (plan === "p1" || plan === "p2" || plan === "p3") {
      if (window.__stripeEnabled) openStripeCheckoutModal(plan);
      else if (hint) {
        hint.hidden = false;
        hint.textContent = t("checkout.error");
      }
      return;
    }
    if (hint) {
      hint.hidden = false;
      hint.textContent = t("pay.pickPlan");
    }
    document.getElementById("pakot")?.scrollIntoView({ behavior: "smooth" });
  });
}

function bindPackageCards() {
  const cards = document.querySelectorAll(".package-card[data-package]");
  const detailPanel = document.getElementById("package-detail");
  const detailName = document.getElementById("package-detail-name");
  const detailSummary = document.getElementById("package-detail-summary");
  const detailList = document.getElementById("package-detail-list");
  const packageField = document.getElementById("contact-package");
  const oneOnlyHint = document.getElementById("packages-one-only");
  if (!cards.length || !detailPanel) return;

  /** Vetëm një pako e zgjedhur; klik i dytë në të njëjtën e çzgjedh. */
  let lockedPlan = null;

  const clearSelection = () => {
    lockedPlan = null;
    sessionStorage.removeItem("selectedPackage");
    cards.forEach((card) => {
      card.classList.remove("selected");
      card.setAttribute("aria-pressed", "false");
    });
    detailPanel.hidden = true;
    if (packageField) packageField.value = "";
    if (oneOnlyHint) oneOnlyHint.hidden = true;
  };

  const selectPackage = (plan, opts = {}) => {
    const force = !!opts.force;
    if (!force && lockedPlan && lockedPlan !== plan) {
      if (oneOnlyHint) {
        oneOnlyHint.hidden = false;
        oneOnlyHint.textContent = t("packages.oneOnly");
      }
      return;
    }

    if (!force && lockedPlan === plan) {
      clearSelection();
      return;
    }

    const prefix = `packages.${plan}`;
    lockedPlan = plan;

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
    if (oneOnlyHint) {
      oneOnlyHint.hidden = false;
      oneOnlyHint.textContent = t("packages.oneOnly");
    }

    if (packageField) {
      packageField.value = t(`${prefix}.name`);
    }

    const ctaBtn = document.getElementById("package-detail-cta");
    if (ctaBtn) {
      if (plan === "p4") ctaBtn.textContent = t("cta.contactAi");
      else if (window.__stripeEnabled) ctaBtn.textContent = t("cta.payStripe");
      else ctaBtn.textContent = t("cta.buyPackage");
    }

    const dlBtn = document.getElementById("package-detail-download");
    if (dlBtn) {
      dlBtn.href = setupDownloadHref(plan);
      dlBtn.hidden = false;
    }
    const getStartedDl = document.getElementById("get-started-download");
    if (getStartedDl) getStartedDl.href = setupDownloadHref(plan);

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

  document.getElementById("package-detail-cta")?.addEventListener("click", async () => {
    const plan = sessionStorage.getItem("selectedPackage") || "";
    const pkg = document.getElementById("contact-package")?.value.trim() || "";
    let digits = "38348707880";
    let stripeOn = !!window.__stripeEnabled;
    try {
      const res = await fetch("/api/public/config");
      const data = await res.json();
      if (res.ok && data.ok) {
        if (data.support_phone_digits) digits = data.support_phone_digits;
        if (data.stripe_enabled) {
          stripeOn = true;
          window.__stripeEnabled = true;
        }
      }
    } catch {
      /* fallback */
    }
    if (plan === "p4") {
      const text = `Përshëndetje, dua informacion për AI (Pako 4).\nPako: ${pkg}`;
      window.open(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
      return;
    }
    if (stripeOn && (plan === "p1" || plan === "p2" || plan === "p3")) {
      document.getElementById("pagesa")?.scrollIntoView({ behavior: "smooth" });
      openStripeCheckoutModal(plan);
      return;
    }
    window.location.href = setupDownloadHref(plan || "p1");
  });

  const saved = sessionStorage.getItem("selectedPackage");
  if (saved && PACKAGE_PLANS.includes(saved)) {
    selectPackage(saved, { force: true });
  }
}

async function openTrialModal() {
  const existing = document.getElementById("trial-modal");
  if (existing) existing.remove();

  let phone = "+383 48707880";
  let digits = "38348707880";
  try {
    const res = await fetch("/api/public/config");
    const data = await res.json();
    if (res.ok && data.ok) {
      if (data.support_phone) phone = data.support_phone;
      if (data.support_phone_digits) digits = data.support_phone_digits;
    }
  } catch {
    /* default */
  }

  const waText = encodeURIComponent(t("wa.trial"));
  const plan = sessionStorage.getItem("selectedPackage") || "p1";
  const modal = document.createElement("div");
  modal.id = "trial-modal";
  modal.className = "checkout-modal";
  modal.innerHTML = `
    <div class="checkout-modal-card" role="dialog" aria-modal="true" aria-labelledby="trial-title">
      <h3 id="trial-title">${t("trialModal.title")}</h3>
      <p class="trial-modal-body">${t("trialModal.body")}</p>
      <p class="trial-modal-phone">
        <span>${t("trialModal.phoneLabel")}</span>
        <a href="tel:+${digits}">${phone}</a>
      </p>
      <div class="checkout-actions">
        <a class="btn btn-primary" href="${setupDownloadHref(plan)}" download>${t("trialModal.download")}</a>
        <a class="btn btn-ghost" href="https://wa.me/${digits}?text=${waText}" target="_blank" rel="noopener noreferrer">${t("trialModal.wa")}</a>
        <button type="button" class="btn btn-ghost" id="trial-close">${t("trialModal.close")}</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector("#trial-close")?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });
}

function bindTrialModal() {
  document.querySelectorAll("[data-trial-modal]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      openTrialModal();
    });
  });
}

const FALLBACK_BANK = {
  company: "REVOLUTION INVEST SH.P.K.",
  bank: "Raiffeisen Bank Kosovo",
  account: "1504001010467891",
  currency: "EUR",
  nui: "811314567",
};

async function fetchBankTransferDetails() {
  try {
    const res = await fetch("/api/payments/bank-transfer");
    const data = await res.json();
    if (res.ok && data.ok && data.account) {
      return {
        company: data.company || FALLBACK_BANK.company,
        bank: data.bank || FALLBACK_BANK.bank,
        account: data.account,
        currency: data.currency || FALLBACK_BANK.currency,
        nui: data.nui || FALLBACK_BANK.nui,
      };
    }
  } catch {
    /* fallback */
  }
  return { ...FALLBACK_BANK };
}

function openBankTransferModal(plan, bankKey) {
  const existing = document.getElementById("bank-transfer-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "bank-transfer-modal";
  modal.className = "checkout-modal";
  modal.innerHTML = `
    <div class="checkout-modal-card checkout-modal-card-wide" role="dialog" aria-modal="true" aria-labelledby="bank-title">
      <h3 id="bank-title">${t("bank.title")}</h3>
      <p class="checkout-plan-label">${t(`packages.${plan}.name`)}</p>
      <p class="bank-intro">${t("bank.intro")}</p>
      <div class="bank-details" id="bank-details" aria-busy="true">…</div>
      <label>${t("checkout.emri")}<input id="bk-emri" autocomplete="name" required></label>
      <label>${t("checkout.biznesi")}<input id="bk-biz" autocomplete="organization" required></label>
      <label>${t("checkout.email")}<input id="bk-email" type="email" autocomplete="email" required></label>
      <label>${t("checkout.telefoni")}<input id="bk-phone" type="tel" autocomplete="tel"></label>
      <label>${t("checkout.tipi")}
        <select id="bk-tipi">
          <option value="restorant">${t("checkout.tipi.restorant")}</option>
          <option value="kafene">${t("checkout.tipi.kafene")}</option>
          <option value="dyqan">${t("checkout.tipi.dyqan")}</option>
        </select>
      </label>
      <p class="checkout-msg" id="bk-msg" hidden></p>
      <div class="checkout-actions">
        <button type="button" class="btn btn-primary" id="bk-submit">${t("bank.submit")}</button>
        <button type="button" class="btn btn-ghost" id="bk-cancel">${t("checkout.cancel")}</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector("#bk-cancel")?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  const detailsEl = modal.querySelector("#bank-details");
  fetchBankTransferDetails().then((bank) => {
    if (!detailsEl) return;
    detailsEl.removeAttribute("aria-busy");
    detailsEl.innerHTML = `
      <div class="bank-detail-row"><span>${t("bank.company")}</span><strong>${bank.company}</strong></div>
      <div class="bank-detail-row"><span>${t("bank.bankName")}</span><strong>${bank.bank}</strong></div>
      <div class="bank-detail-row"><span>${t("bank.account")}</span><strong class="bank-account-num" id="bk-account">${bank.account}</strong></div>
      <div class="bank-detail-row"><span>${t("bank.currency")}</span><strong>${bank.currency}</strong></div>
      <div class="bank-detail-row"><span>${t("bank.nui")}</span><strong>${bank.nui}</strong></div>
      <button type="button" class="btn btn-ghost bank-copy-btn" id="bk-copy">${t("bank.copy")}</button>`;
    modal.querySelector("#bk-copy")?.addEventListener("click", async () => {
      const copyBtn = modal.querySelector("#bk-copy");
      try {
        await navigator.clipboard.writeText(bank.account);
        if (copyBtn) copyBtn.textContent = t("bank.copied");
      } catch {
        /* ignore */
      }
    });
  });

  modal.querySelector("#bk-submit")?.addEventListener("click", async () => {
    const btn = modal.querySelector("#bk-submit");
    const msg = modal.querySelector("#bk-msg");
    const emri = String(modal.querySelector("#bk-emri")?.value || "").trim();
    const biz = String(modal.querySelector("#bk-biz")?.value || "").trim();
    const email = String(modal.querySelector("#bk-email")?.value || "").trim();
    const phone = String(modal.querySelector("#bk-phone")?.value || "").trim();
    const tipi = String(modal.querySelector("#bk-tipi")?.value || "restorant");
    if (!emri || !biz || !email) {
      if (msg) {
        msg.hidden = false;
        msg.textContent = t("bank.error");
      }
      return;
    }
    if (btn) {
      btn.disabled = true;
      btn.textContent = t("bank.busy");
    }
    try {
      const res = await fetch("/api/payments/bank-transfer/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          bank: bankKey,
          emri,
          emri_biznesit: biz,
          email,
          telefoni: phone,
          tipi,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.gabim || t("bank.error"));
      }
      if (msg) {
        msg.hidden = false;
        msg.classList.add("checkout-msg-ok");
        msg.textContent = data.message || t("bank.success");
      }
      if (btn) {
        btn.disabled = true;
        btn.textContent = t("bank.submit");
      }
    } catch (err) {
      if (msg) {
        msg.hidden = false;
        msg.textContent = err.message || t("bank.error");
      }
      if (btn) {
        btn.disabled = false;
        btn.textContent = t("bank.submit");
      }
    }
  });
}

function openStripeCheckoutModal(plan) {
  const existing = document.getElementById("stripe-checkout-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "stripe-checkout-modal";
  modal.className = "checkout-modal";
  modal.innerHTML = `
    <div class="checkout-modal-card" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
      <h3 id="checkout-title">${t("checkout.title")}</h3>
      <p class="checkout-plan-label">${t(`packages.${plan}.name`)}</p>
      <label>${t("checkout.emri")}<input id="co-emri" autocomplete="name" required></label>
      <label>${t("checkout.biznesi")}<input id="co-biz" autocomplete="organization" required></label>
      <label>${t("checkout.email")}<input id="co-email" type="email" autocomplete="email" required></label>
      <label>${t("checkout.telefoni")}<input id="co-phone" type="tel" autocomplete="tel"></label>
      <label>${t("checkout.tipi")}
        <select id="co-tipi">
          <option value="restorant">${t("checkout.tipi.restorant")}</option>
          <option value="kafene">${t("checkout.tipi.kafene")}</option>
          <option value="dyqan">${t("checkout.tipi.dyqan")}</option>
        </select>
      </label>
      <p class="checkout-msg" id="co-msg" hidden></p>
      <div class="checkout-actions">
        <button type="button" class="btn btn-primary" id="co-pay">${t("checkout.pay")}</button>
        <button type="button" class="btn btn-ghost" id="co-cancel">${t("checkout.cancel")}</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector("#co-cancel")?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  modal.querySelector("#co-pay")?.addEventListener("click", async () => {
    const btn = modal.querySelector("#co-pay");
    const msg = modal.querySelector("#co-msg");
    const emri = String(modal.querySelector("#co-emri")?.value || "").trim();
    const biz = String(modal.querySelector("#co-biz")?.value || "").trim();
    const email = String(modal.querySelector("#co-email")?.value || "").trim();
    const phone = String(modal.querySelector("#co-phone")?.value || "").trim();
    const tipi = String(modal.querySelector("#co-tipi")?.value || "restorant");
    if (!emri || !biz || !email) {
      if (msg) {
        msg.hidden = false;
        msg.textContent = t("checkout.error");
      }
      return;
    }
    if (btn) {
      btn.disabled = true;
      btn.textContent = t("checkout.busy");
    }
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          emri,
          emri_biznesit: biz,
          email,
          telefoni: phone,
          tipi,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.url) {
        throw new Error(data.gabim || t("checkout.error"));
      }
      window.location.href = data.url;
    } catch (err) {
      if (msg) {
        msg.hidden = false;
        msg.textContent = err.message || t("checkout.error");
      }
      if (btn) {
        btn.disabled = false;
        btn.textContent = t("checkout.pay");
      }
    }
  });
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
            <button type="button" class="btn btn-hero-primary" data-trial-modal>${t("hero.cta.primary")}</button>
            <a class="btn btn-hero-secondary" href="#pajisjet">${t("nav.equipment")}</a>
            <a class="btn btn-hero-ghost" href="#pakot">${t("hero.cta.secondary")}</a>
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

      <section class="site-section equip-section" id="pajisjet">
        <div class="container">
          <div class="equip-layout">
            <div class="equip-copy">
              <p class="equip-eyebrow">${t("nav.equipment")}</p>
              <h2>${t("equip.title")}</h2>
              <p class="equip-subtitle">${t("equip.subtitle")}</p>
              <p class="equip-lead">${t("equip.lead")}</p>
              <h3 class="equip-points-title">${t("equip.pointsTitle")}</h3>
              <ul class="equip-points">
                <li><strong>${t("equip.p1.title")}</strong><span>${t("equip.p1.desc")}</span></li>
                <li><strong>${t("equip.p2.title")}</strong><span>${t("equip.p2.desc")}</span></li>
                <li><strong>${t("equip.p3.title")}</strong><span>${t("equip.p3.desc")}</span></li>
                <li><strong>${t("equip.p4.title")}</strong><span>${t("equip.p4.desc")}</span></li>
                <li><strong>${t("equip.p5.title")}</strong><span>${t("equip.p5.desc")}</span></li>
              </ul>
              <p class="equip-closing">${t("equip.closing")}</p>
              <div class="equip-actions">
                <a class="btn btn-primary" id="equip-wa" href="https://wa.me/38348707880" target="_blank" rel="noopener noreferrer">${t("equip.cta")}</a>
                <a class="btn btn-ghost" href="#pakot">${t("equip.ctaSecondary")}</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="site-section get-started-section" id="si-ta-ngarkoni">
        <div class="container">
          <div class="section-head">
            <h2>${t("getStarted.title")}</h2>
            <p>${t("getStarted.subtitle")}</p>
          </div>
          <ol class="get-started-steps">
            <li>
              <strong>${t("getStarted.s1.title")}</strong>
              <p>${t("getStarted.s1.desc")}</p>
            </li>
            <li>
              <strong>${t("getStarted.s2.title")}</strong>
              <p>${t("getStarted.s2.desc")}</p>
            </li>
            <li>
              <strong>${t("getStarted.s3.title")}</strong>
              <p>${t("getStarted.s3.desc")}</p>
            </li>
            <li>
              <strong>${t("getStarted.s4.title")}</strong>
              <p>${t("getStarted.s4.desc")}</p>
            </li>
            <li>
              <strong>${t("getStarted.s5.title")}</strong>
              <p>${t("getStarted.s5.desc")}</p>
            </li>
            <li>
              <strong>${t("getStarted.s6.title")}</strong>
              <p>${t("getStarted.s6.desc")}</p>
            </li>
          </ol>
          <div class="get-started-actions">
            <a class="btn btn-primary" id="get-started-download" href="/api/public/setup-download?plan=p1">${t("getStarted.cta")}</a>
            <a class="btn btn-ghost" href="#pakot">${t("nav.packages")}</a>
            <a class="btn btn-ghost" id="get-started-wa" href="https://wa.me/38348707880" target="_blank" rel="noopener noreferrer">${t("getStarted.ctaHelp")}</a>
          </div>
          <p class="get-started-note">${t("getStarted.note")}</p>
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
            <p class="packages-hint packages-price-hint">${t("packages.priceHint")}</p>
            <p class="packages-hint" id="packages-one-only" hidden></p>
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
            <div class="package-detail-actions">
              <a class="btn btn-ghost" id="package-detail-download" href="/api/public/setup-download" hidden>${t("cta.downloadSetup")}</a>
              <button class="btn btn-primary" type="button" id="package-detail-cta">${t("cta.choosePackage")}</button>
            </div>
          </div>
        </div>
      </section>

      <section class="site-section pay-section" id="pagesa">
        <div class="container">
          <div class="section-head">
            <h2>${t("pay.title")}</h2>
            <p>${t("pay.subtitle")}</p>
          </div>
          <div class="pay-methods">
            <div class="pay-card pay-card-stripe">
              <strong class="pay-card-title">${t("pay.stripe")}</strong>
              <span class="pay-method-desc">${t("pay.stripeDesc")}</span>
              <div class="pay-logo-row" aria-hidden="true">
                <span class="pay-logo pay-logo-stripe" title="Stripe"></span>
                <span class="pay-logo pay-logo-visa" title="Visa"></span>
                <span class="pay-logo pay-logo-mc" title="Mastercard"></span>
                <span class="pay-logo pay-logo-paypal" title="PayPal"></span>
              </div>
              <button type="button" class="btn btn-primary pay-method-btn" id="pay-stripe-cta">${t("pay.ctaStripe")}</button>
            </div>
            <div class="pay-card pay-card-banks">
              <strong class="pay-card-title">${t("pay.banks")}</strong>
              <p class="pay-banks-desc">${t("pay.banksDesc")}</p>
              <div class="pay-banks-grid" role="group" aria-label="${t("pay.banks")}">
                <button type="button" class="pay-bank" data-pay-bank="teb" aria-label="${t("pay.bank.teb")}">
                  <span class="pay-bank-logo pay-bank-teb" aria-hidden="true"></span>
                </button>
                <button type="button" class="pay-bank" data-pay-bank="raiffeisen" aria-label="${t("pay.bank.raiffeisen")}">
                  <span class="pay-bank-logo pay-bank-raiffeisen" aria-hidden="true"></span>
                </button>
                <button type="button" class="pay-bank" data-pay-bank="nlb" aria-label="${t("pay.bank.nlb")}">
                  <span class="pay-bank-logo pay-bank-nlb" aria-hidden="true"></span>
                </button>
                <button type="button" class="pay-bank" data-pay-bank="bkt" aria-label="${t("pay.bank.bkt")}">
                  <span class="pay-bank-logo pay-bank-bkt" aria-hidden="true"></span>
                </button>
                <button type="button" class="pay-bank" data-pay-bank="procredit" aria-label="${t("pay.bank.procredit")}">
                  <span class="pay-bank-logo pay-bank-procredit" aria-hidden="true"></span>
                </button>
                <button type="button" class="pay-bank" data-pay-bank="bpb" aria-label="${t("pay.bank.bpb")}">
                  <span class="pay-bank-logo pay-bank-bpb" aria-hidden="true"></span>
                </button>
              </div>
            </div>
          </div>
          <p class="pay-hint" id="pay-hint" hidden></p>
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
  bindGetStartedDownload();
  bindPaymentSection();
  bindTrialModal();
  bindStripeConfigAndPaymentBanner();
  (async () => {
    const el = document.getElementById("equip-wa");
    if (!el) return;
    try {
      const res = await fetch("/api/public/config");
      const data = await res.json();
      const digits = data?.support_phone_digits || "38348707880";
      el.href = `https://wa.me/${digits}?text=${encodeURIComponent(t("equip.wa"))}`;
    } catch {
      el.href = `https://wa.me/38348707880?text=${encodeURIComponent(t("equip.wa"))}`;
    }
  })();

  if (window.location.hash) {
    requestAnimationFrame(() => {
      document.querySelector(window.location.hash)?.scrollIntoView({ behavior: "smooth" });
    });
  } else {
    window.scrollTo(0, 0);
  }
}
