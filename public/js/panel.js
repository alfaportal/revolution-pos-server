let token = localStorage.getItem("rip_token") || "";
let licensesPollTimer = null;
let publicAppOrigin = "https://revolution-pos.com";

const ADMIN_PWA_BANNER_KEY = "ri_admin_pwa_banner_dismissed";

function isStandalonePwa() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function isIosDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function initAdminPwaBanner() {
  const banner = document.getElementById("pwa-install-banner");
  const hint = document.getElementById("pwa-install-hint");
  const closeBtn = document.getElementById("pwa-install-close");
  if (!banner || !hint || !closeBtn) return;

  if (isStandalonePwa() || localStorage.getItem(ADMIN_PWA_BANNER_KEY) === "1") return;

  hint.textContent = isIosDevice()
    ? "Share (□↑) → Add to Home Screen — pastaj hap nga ikona, si aplikacion."
    : "Menu (3 pika) → Add to Home Screen — pastaj hap nga ikona, si aplikacion.";

  banner.classList.remove("hidden");

  closeBtn.addEventListener("click", () => {
    localStorage.setItem(ADMIN_PWA_BANNER_KEY, "1");
    banner.classList.add("hidden");
  });
}

initAdminPwaBanner();

function apiUrl(path) {
  if (path.startsWith("http")) return path;
  return `${window.location.origin}${path}`;
}

function publicOrigin() {
  return String(publicAppOrigin || "https://revolution-pos.com").replace(/\/+$/, "");
}

async function loadPublicConfig() {
  try {
    const res = await fetch(apiUrl("/api/public/config"));
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.public_origin) {
      publicAppOrigin = String(data.public_origin).replace(/\/+$/, "");
    }
  } catch {
    /* keep default */
  }
  setupOwnerLoginUrl();
}

async function api(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(apiUrl(path), { ...opts, headers, credentials: "include" });
  } catch (netErr) {
    throw new Error(
      `Nuk u lidh me serverin (${netErr.message}). Kontrollo /health/db dhe rifresko faqen (Ctrl+F5).`,
    );
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data.gabim || data.error || data.message || `HTTP ${res.status}`;
    throw new Error(data.code ? `${detail} [${data.code}]` : detail);
  }
  return data;
}

async function safeRefresh() {
  try {
    await refreshAll();
    if (hubClientId) fillHubLinks(hubClientId);
  } catch (e) {
    console.warn("refreshAll:", e.message);
  }
}

function show(el, visible) {
  document.getElementById(el).classList.toggle("hidden", !visible);
}

function showMsg(id, text, ok) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = `alert ${ok ? "alert-success" : "alert-error"}`;
  el.classList.remove("hidden");
  if (ok) setTimeout(() => el.classList.add("hidden"), 4000);
}

function badge(status) {
  return `<span class="badge badge-${status}">${status}</span>`;
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("sq-AL");
}

function fmtDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("sq-AL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function licenseIsExpired(l) {
  if (!l?.data_skadimit) return false;
  return l.data_skadimit < new Date().toISOString().slice(0, 10);
}

function licenseProblems(l) {
  const problems = [];
  if (l.last_validation_error) problems.push(String(l.last_validation_error));
  if (l.statusi === "revokuar") problems.push("Liçenca është revokuar.");
  if (l.statusi === "pezulluar") problems.push("Liçenca është pezulluar.");
  if (l.statusi === "skaduar") problems.push("Liçenca është shënuar si skaduar.");
  if (licenseIsExpired(l) && l.statusi === "aktive") {
    problems.push("Data e skadimit ka kaluar.");
  }
  return [...new Set(problems)];
}

function licenseStatusCell(l) {
  const problems = licenseProblems(l);
  if (l.terminal_limit_reached) {
    problems.push(`Terminale: ${terminalCountLabel(l)}`);
  }
  const warn = problems.length
    ? `<span class="license-warn" title="${esc(problems.join(" — "))}" aria-label="Problem">⚠️</span> `
    : "";
  let extra = "";
  if (l.terminal_over_limit && l.terminal_in_grace) {
    extra = ` <span class="badge badge-stock-warning">Grace</span>`;
  } else if (l.terminal_limit_reached) {
    extra = ` <span class="badge badge-stock-out">Limit</span>`;
  }
  return `${warn}${badge(l.statusi)}${extra}`;
}

function calcTerminalTotalPrice(basePrice, maxTerminals, terminalPrice) {
  const base = Number(basePrice) || 0;
  const max = Math.max(1, Number(maxTerminals) || 1);
  const extra = Math.max(0, max - 1);
  return base + extra * (Number(terminalPrice) || 0);
}

function terminalCountLabel(l) {
  const active = Number(l.active_terminal_count) || 0;
  const max = Number(l.max_terminals) || 1;
  return `${active} / ${max}`;
}

function licenseDeviceId(l) {
  return String(l.display_device_id || l.device_id || "").trim().toUpperCase();
}

function licenseDeviceIds(l) {
  const ids = Array.isArray(l.display_device_ids) ? l.display_device_ids.filter(Boolean) : [];
  const primary = licenseDeviceId(l);
  if (primary && !ids.includes(primary)) return [primary, ...ids];
  return ids.length ? ids : primary ? [primary] : [];
}

function licenseDeviceCellHtml(l) {
  const devId = licenseDeviceId(l);
  const allIds = licenseDeviceIds(l);
  const extra =
    allIds.length > 1
      ? `<div class="device-id-extra">${allIds.map(id => `<code class="mono">${esc(id)}</code>`).join(" ")}</div>`
      : "";
  return `<div class="device-id-editor">
    <input
      type="text"
      class="device-id-input mono"
      data-device-input="${l.id}"
      value="${esc(devId)}"
      placeholder="Gjenero ID ose ngjite nga POS"
      autocomplete="off"
      autocapitalize="characters"
      maxlength="12"
    >
    <div class="device-id-editor-actions">
      <button type="button" class="btn btn-ghost btn-sm" data-gen-device-row="${l.id}">Gjenero ID</button>
      <button type="button" class="btn btn-primary btn-sm" data-save-device="${l.id}">Ruaj ID</button>
      <button type="button" class="btn btn-accent btn-sm" data-provision-device="${l.id}">Gjenero &amp; ruaj</button>
      ${devId ? `<button type="button" class="btn btn-ghost btn-sm" data-copy-device-id="${l.id}">Kopjo</button>` : ""}
    </div>
    ${extra}
  </div>`;
}

async function apiGenerateLicenseKey() {
  const { celesi } = await api("/api/admin/licenses/generate-key");
  return celesi;
}

async function apiGenerateDeviceId() {
  const { device_id } = await api("/api/admin/licenses/generate-device-id");
  return device_id;
}

async function fillLicensePair(keyInputId, deviceInputId) {
  const [celesi, deviceId] = await Promise.all([apiGenerateLicenseKey(), apiGenerateDeviceId()]);
  const keyEl = document.getElementById(keyInputId);
  const devEl = document.getElementById(deviceInputId);
  if (keyEl) keyEl.value = celesi;
  if (devEl) devEl.value = deviceId;
  return { celesi, device_id: deviceId };
}

function bindLicenseModalPairActions({ keyId, deviceId, genKeyId, genDeviceId, genBothId }) {
  const modal = document.getElementById("modal-form");
  if (!modal) return;
  modal.querySelector(`#${genKeyId}`)?.addEventListener("click", async e => {
    e.preventDefault();
    try {
      document.getElementById(keyId).value = await apiGenerateLicenseKey();
    } catch (err) {
      alert(err.message || "Gjenerimi i kodit dështoi.");
    }
  });
  modal.querySelector(`#${genDeviceId}`)?.addEventListener("click", async e => {
    e.preventDefault();
    try {
      document.getElementById(deviceId).value = await apiGenerateDeviceId();
    } catch (err) {
      alert(err.message || "Gjenerimi i ID-së dështoi.");
    }
  });
  modal.querySelector(`#${genBothId}`)?.addEventListener("click", async e => {
    e.preventDefault();
    try {
      await fillLicensePair(keyId, deviceId);
    } catch (err) {
      alert(err.message || "Gjenerimi dështoi.");
    }
  });
}

function licensePairFieldsHtml(l, { keyName = "celesi", deviceName = "device_id", prefix = "modal-edit" } = {}) {
  const devId = licenseDeviceId(l);
  return `
    <p class="field-hint license-pair-modal-hint">
      <strong>Ti vendos kodin dhe ID-në këtu</strong> — shkruaj manualisht ose kliko Gjenero. Ruaj → POS përdor këto vlera.
    </p>
    <label for="${prefix}-celesi">Kodi i licencës (KODI)</label>
    <div class="link-actions modal-pair-row">
      <input
        name="${keyName}"
        id="${prefix}-celesi"
        class="mono"
        value="${esc(l.celesi)}"
        required
        autocomplete="off"
        autocapitalize="characters"
      >
      <button type="button" class="btn btn-ghost btn-sm" id="${prefix}-gen-key">Gjenero kod</button>
    </div>
    <label for="${prefix}-device-id"><strong>ID Pajisjes</strong></label>
    <div class="link-actions modal-pair-row">
      <input
        name="${deviceName}"
        id="${prefix}-device-id"
        class="mono"
        value="${esc(l.device_id || devId)}"
        placeholder="Shkruaj ose gjenero ID (12 karaktere)"
        autocomplete="off"
        autocapitalize="characters"
        maxlength="12"
      >
      <button type="button" class="btn btn-ghost btn-sm" id="${prefix}-gen-device">Gjenero ID</button>
    </div>
    <div class="license-create-actions" style="margin-bottom:0.75rem">
      <button type="button" class="btn btn-accent btn-sm" id="${prefix}-gen-both">Gjenero kod + ID</button>
    </div>`;
}

async function prepareLicenseCreateForm() {
  const keyEl = document.getElementById("ld-celesi");
  const devEl = document.getElementById("ld-device-id");
  if (!keyEl || !devEl) return;
  if (keyEl.value.trim() && devEl.value.trim()) return;
  try {
    await fillLicensePair("ld-celesi", "ld-device-id");
  } catch {
    /* ignore */
  }
}

function licenseTerminalFieldsHtml(l, { prefix = "license-edit" } = {}) {
  const maxVal = Number(l?.max_terminals) || 1;
  const baseVal = Number(l?.base_price) || 0;
  const termPrice = Number(l?.terminal_price) || 0;
  const total = calcTerminalTotalPrice(baseVal, maxVal, termPrice);
  const selected99 = maxVal > 5 ? " selected" : "";
  return `
    <label for="${prefix}-max-terminals">Nr. terminaleve</label>
    <select id="${prefix}-max-terminals" name="max_terminals">
      ${[1, 2, 3, 4, 5].map(n => `<option value="${n}"${maxVal === n ? " selected" : ""}>${n}</option>`).join("")}
      <option value="99"${selected99}>5+</option>
    </select>
    <label for="${prefix}-base-price">Çmimi bazë (€)</label>
    <input type="number" id="${prefix}-base-price" name="base_price" min="0" step="0.01" value="${baseVal.toFixed(2)}">
    <label for="${prefix}-terminal-price">Çmimi shtesë/terminal (€)</label>
    <input type="number" id="${prefix}-terminal-price" name="terminal_price" min="0" step="0.01" value="${termPrice.toFixed(2)}">
    <p class="field-hint license-price-total" id="${prefix}-price-total">Totali: ${total.toFixed(2)}€ (bazë + ${Math.max(0, maxVal - 1)} × terminal)</p>`;
}

function bindLicensePriceCalc(modalRoot, prefix = "license-edit") {
  const maxEl = modalRoot.querySelector(`#${prefix}-max-terminals`);
  const baseEl = modalRoot.querySelector(`#${prefix}-base-price`);
  const termEl = modalRoot.querySelector(`#${prefix}-terminal-price`);
  const totalEl = modalRoot.querySelector(`#${prefix}-price-total`);
  if (!maxEl || !baseEl || !termEl || !totalEl) return;
  const refresh = () => {
    const max = Number(maxEl.value) || 1;
    const total = calcTerminalTotalPrice(baseEl.value, max, termEl.value);
    totalEl.textContent = `Totali: ${total.toFixed(2)}€ (bazë + ${Math.max(0, max - 1)} × terminal)`;
  };
  [maxEl, baseEl, termEl].forEach(el => {
    el.addEventListener("input", refresh);
    el.addEventListener("change", refresh);
  });
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

let clientsCache = [];
let licensesCache = [];
let ownersCache = [];
let packageTiersCache = [];
let trialAlertsCache = [];
let stockAlertsCache = [];
let modalState = null;

/** Fallback — same as src/lib/packages.js (used when tier cache is empty or stale). */
const TIER_FEATURES = {
  pako_1: { pos: true, owner_panel: true, website: true, mobile: false, kds: false, kiosk: false, waiter: false },
  pako_1_1: { pos: true, owner_panel: true, website: true, mobile: true, kds: false, kiosk: false, waiter: false },
  pako_2: { pos: true, owner_panel: true, website: true, mobile: false, kds: true, kiosk: true, waiter: true },
  pako_2_1: { pos: true, owner_panel: true, website: true, mobile: true, kds: true, kiosk: true, waiter: true },
};

function normalizeTierId(tier) {
  const t = String(tier || "pako_1").trim().toLowerCase().replace(/\./g, "_");
  return Object.prototype.hasOwnProperty.call(TIER_FEATURES, t) ? t : "pako_1";
}

async function loadPackageTiers() {
  const { tiers } = await api("/api/admin/package-tiers");
  packageTiersCache = tiers || [];
  populatePackageTierSelect(document.getElementById("c-package-tier"), "pako_1");
}

function packageTierLabel(id) {
  const tierId = normalizeTierId(id);
  const tier = packageTiersCache.find(t => t.id === tierId);
  return tier?.label || tierId || "pako_1";
}

function packageTierOptionsHtml(selected) {
  const sel = normalizeTierId(selected || "pako_1");
  if (!packageTiersCache.length) {
    return ["pako_1", "pako_1_1", "pako_2", "pako_2_1"]
      .map(id => `<option value="${id}"${id === sel ? " selected" : ""}>${id}</option>`)
      .join("");
  }
  return packageTiersCache
    .map(t => `<option value="${esc(t.id)}"${t.id === sel ? " selected" : ""}>${esc(t.label)}</option>`)
    .join("");
}

function populatePackageTierSelect(el, selected) {
  if (!el) return;
  el.innerHTML = packageTierOptionsHtml(selected);
}

function readModalPackageTier(fd) {
  const el = document.getElementById("modal-package-tier");
  const value = (el?.value || fd.get("package_tier") || "").trim();
  return normalizeTierId(value || "pako_1");
}

function mergeClientIntoCache(updatedClient) {
  if (!updatedClient?.id) return;
  const idx = clientsCache.findIndex(c => c.id === updatedClient.id);
  const merged = {
    ...updatedClient,
    package_tier: normalizeTierId(updatedClient.package_tier),
  };
  if (idx >= 0) {
    clientsCache[idx] = { ...clientsCache[idx], ...merged };
  }
}

function openModal(title, fieldsHtml, onSave) {
  modalState = { onSave };
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-form").innerHTML = fieldsHtml;
  document.getElementById("modal-error").classList.add("hidden");
  document.getElementById("modal-edit").classList.remove("hidden");
  requestAnimationFrame(() => {
    const first = document.getElementById("modal-form").querySelector(
      "input:not([readonly]):not([type=hidden]), select, textarea",
    );
    if (first) {
      first.focus({ preventScroll: false });
    }
  });
}

function closeModal() {
  modalState = null;
  document.getElementById("modal-edit").classList.add("hidden");
  document.getElementById("modal-form").innerHTML = "";
}

document.getElementById("modal-cancel").addEventListener("click", closeModal);
document.getElementById("modal-backdrop").addEventListener("click", closeModal);

document.getElementById("modal-form").addEventListener("submit", async e => {
  e.preventDefault();
  if (!modalState) return;
  const errEl = document.getElementById("modal-error");
  const btn = document.getElementById("modal-save");
  errEl.classList.add("hidden");
  btn.disabled = true;
  try {
    await modalState.onSave(new FormData(e.target));
    closeModal();
    await safeRefresh();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove("hidden");
  } finally {
    btn.disabled = false;
  }
});

async function confirmDelete(message, fn) {
  if (!confirm(message)) return;
  try {
    await fn();
    await safeRefresh();
  } catch (err) {
    alert(err.message);
  }
}

function actionBtns(editId, deleteId, editLabel = "Ndrysho") {
  return `<button class="btn btn-ghost btn-sm" data-edit="${editId}">${editLabel}</button>
    <button class="btn btn-danger btn-sm" data-del="${deleteId}">Fshi</button>`;
}

function findOwnerForClient(clientId) {
  return ownersCache.find(o => o.client_id === clientId);
}

function openEditClient(id) {
  const c = clientsCache.find(x => x.id === id);
  if (!c) return;
  const owner = findOwnerForClient(id);
  const ownerEmail = owner?.email || c.email || "";
  const ownerPwRequired = owner ? "" : "required";
  const ownerPwHint = owner
    ? "Lëreni bosh për të mos ndryshuar fjalëkalimin."
    : "Vendosni fjalëkalim — krijohet llogaria për /owner/login.";

  openModal("Ndrysho klientin", `
    <label>Emri *</label>
    <input name="emri" required value="${esc(c.emri)}">
    <label>Tipi</label>
    <select name="tipi">
      <option value="restorant" ${c.tipi === "restorant" ? "selected" : ""}>Restorant</option>
      <option value="kafene" ${c.tipi === "kafene" ? "selected" : ""}>Kafene</option>
      <option value="tjeter" ${c.tipi === "tjeter" ? "selected" : ""}>Tjetër</option>
    </select>
    <label>Pakoja</label>
    <select name="package_tier" id="modal-package-tier"></select>
    <label>Telefoni</label>
    <input name="telefoni" value="${esc(c.telefoni)}">
    <label>Email (kontakt biznesi)</label>
    <input type="email" name="email" value="${esc(c.email)}">
    <label>Adresa</label>
    <input name="adresa" value="${esc(c.adresa)}">
    <hr style="margin:1.25rem 0;border:none;border-top:1px solid var(--border)">
    <p class="field-hint license-device-hint" style="margin-bottom:0.75rem">
      <strong>Arka fiskale (ATK)</strong> — vlen për çdo biznes; POS lidhet me COM port lokal.
    </p>
    <label>Nr.Fisk</label>
    <input name="fiscal_nr" id="modal-fiscal-nr" placeholder="Nr. fiskal ATK">
    <label>COM Port</label>
    <input name="fiscal_com_port" id="modal-fiscal-com" placeholder="p.sh. COM3">
    <label>Operatori / përgjegjësi</label>
    <input name="fiscal_operator_name" id="modal-fiscal-operator" placeholder="Emri">
    <label>Modeli i arkës</label>
    <input name="fiscal_device_model" id="modal-fiscal-model" placeholder="Opsionale">
    <hr style="margin:1.25rem 0;border:none;border-top:1px solid var(--border)">
    <p class="field-hint license-device-hint" style="margin-bottom:0.75rem">
      <strong>Hyrja e pronarit</strong> — pronari hyn në <code>/owner/login</code> me email dhe fjalëkalim (jo Super Admin).
    </p>
    <label>Email i pronarit (hyrje) *</label>
    <input type="email" name="owner_email" required value="${esc(ownerEmail)}" autocomplete="off">
    <label>Fjalëkalimi i pronarit ${owner ? "" : "*"}</label>
    <input
      type="password"
      name="owner_password"
      minlength="6"
      placeholder="min. 6 karaktere"
      autocomplete="new-password"
      ${ownerPwRequired}
    >
    <p class="field-hint">${ownerPwHint}</p>
    ${owner ? `<p class="field-hint" style="margin-top:0.35rem">Llogaria: <strong>${owner.account_status === "aktiv" ? "aktive" : "në pritje"}</strong></p>` : ""}
  `, async fd => {
    const emri = String(fd.get("emri") ?? "").trim();
    const ownerEmailVal = String(fd.get("owner_email") ?? "").trim().toLowerCase();
    const ownerPassword = String(fd.get("owner_password") ?? "").trim();
    const package_tier = readModalPackageTier(fd);

    const { client: updatedClient } = await api(`/api/admin/clients/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        emri: fd.get("emri"),
        tipi: fd.get("tipi"),
        package_tier,
        telefoni: fd.get("telefoni"),
        email: fd.get("email"),
        adresa: fd.get("adresa"),
      }),
    });
    mergeClientIntoCache(updatedClient);
    if (hubClientId === id) fillHubLinks(id);

    const fiscalBody = {
      fiscal_nr: String(fd.get("fiscal_nr") ?? "").trim(),
      fiscal_com_port: String(fd.get("fiscal_com_port") ?? "").trim(),
      fiscal_operator_name: String(fd.get("fiscal_operator_name") ?? "").trim(),
      fiscal_device_model: String(fd.get("fiscal_device_model") ?? "").trim(),
    };
    const hasFiscal = Object.values(fiscalBody).some(Boolean);
    if (hasFiscal) {
      await api(`/api/admin/clients/${id}/fiscal`, {
        method: "PATCH",
        body: JSON.stringify(fiscalBody),
      });
    }

    const existingOwner = findOwnerForClient(id);
    if (!existingOwner) {
      if (!ownerPassword) {
        throw new Error("Vendosni fjalëkalimin e pronarit (min. 6 karaktere) për të krijuar llogarinë e hyrjes.");
      }
      await api("/api/admin/owners", {
        method: "POST",
        body: JSON.stringify({
          client_id: id,
          emri,
          email: ownerEmailVal,
          password: ownerPassword,
        }),
      });
      return;
    }

    const ownerBody = { emri, email: ownerEmailVal };
    if (ownerPassword) ownerBody.password = ownerPassword;
    await api(`/api/admin/owners/${existingOwner.id}`, {
      method: "PATCH",
      body: JSON.stringify(ownerBody),
    });
  });

  api(`/api/admin/clients/${id}/fiscal`)
    .then(({ settings }) => {
      const set = (elId, val) => {
        const el = document.getElementById(elId);
        if (el) el.value = val || "";
      };
      set("modal-fiscal-nr", settings.fiscal_nr);
      set("modal-fiscal-com", settings.fiscal_com_port);
      set("modal-fiscal-operator", settings.fiscal_operator_name);
      set("modal-fiscal-model", settings.fiscal_device_model);
    })
    .catch(() => {});

  populatePackageTierSelect(
    document.getElementById("modal-package-tier"),
    normalizeTierId(c.package_tier || "pako_1"),
  );
}

function clientAccessLink(client, kind, extraQuery = "") {
  const slug = client?.kitchen_slug || client?.id || "";
  const key = client?.kitchen_key || "";
  const pathKind = kind === "bar" ? "kitchen" : kind === "kitchen" ? "bar" : kind;
  const base = `${publicOrigin()}/${pathKind}/${encodeURIComponent(slug)}`;
  const q = `key=${encodeURIComponent(key)}${extraQuery ? `&${extraQuery}` : ""}`;
  return `${base}?${q}`;
}

function clientTierFeatures(clientId) {
  const c = clientsCache.find(x => x.id === clientId);
  const tierId = normalizeTierId(c?.package_tier);
  return TIER_FEATURES[tierId] || TIER_FEATURES.pako_1;
}

function setHubLinkRow(rowId, visible, inputId, url) {
  const row = document.getElementById(rowId);
  if (row) row.classList.toggle("hidden", !visible);
  const input = document.getElementById(inputId);
  if (input) input.value = visible ? (url || "") : "";
}

function waiterLink(clientId) {
  const c = clientsCache.find(x => x.id === clientId);
  return c ? clientAccessLink(c, "waiter") : `${publicOrigin()}/waiter/${clientId}`;
}

function kitchenLink(clientId) {
  const c = clientsCache.find(x => x.id === clientId);
  return c ? clientAccessLink(c, "kitchen") : `${publicOrigin()}/bar/${clientId}`;
}

function barLink(clientId) {
  const c = clientsCache.find(x => x.id === clientId);
  return c ? clientAccessLink(c, "bar") : `${publicOrigin()}/kitchen/${clientId}`;
}

function kioskTableLink(clientId, table = 1) {
  const c = clientsCache.find(x => x.id === clientId);
  const slug = c?.kitchen_slug || c?.id || clientId;
  return `${publicOrigin()}/menu/${encodeURIComponent(slug)}/${Number(table) || 1}`;
}

function publicPageLink(clientId) {
  const c = clientsCache.find(x => x.id === clientId);
  if (!c) return "";
  const slug = c.kitchen_slug || c.id || "";
  if (!slug) return "";
  return `${publicOrigin()}/r/${encodeURIComponent(slug)}`;
}

async function copyLink(url, btn) {
  try {
    await navigator.clipboard.writeText(url);
    const prev = btn.textContent;
    btn.textContent = "U kopjua!";
    setTimeout(() => { btn.textContent = prev; }, 2000);
  } catch {
    prompt("Kopjoni linkun:", url);
  }
}

function ownerStatusBadge(o) {
  if (o.account_status === "pending") {
    return '<span class="badge badge-pending">Pending</span>';
  }
  if (o.aktiv === false) {
    return '<span class="badge badge-revokuar">çaktiv</span>';
  }
  return '<span class="badge badge-aktive">Aktiv</span>';
}

function licenseAppTypeLabel(l) {
  const t = l.app_type || l.clients?.tipi || "restorant";
  if (t === "kafene") return "Kafene";
  if (t === "restorant") return "Restorant";
  return esc(t);
}

function licenseAppTypeFromClientTipi(tipi) {
  return tipi === "kafene" ? "kafene" : "restorant";
}

async function copyWaiterLink(clientId, btn) {
  await copyLink(waiterLink(clientId), btn);
}

async function copyKitchenLink(clientId, btn) {
  await copyLink(kitchenLink(clientId), btn);
}

async function copyBarLink(clientId, btn) {
  await copyLink(barLink(clientId), btn);
}

async function copyKioskLink(clientId, btn) {
  await copyLink(kioskTableLink(clientId, 1), btn);
}

let hubClientId = null;
let adminMenuCache = { items: [], categories: [] };

function escAttr(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function showHubMsg(text, ok) {
  const el = document.getElementById("hub-msg");
  if (!el) return;
  if (!text) {
    el.classList.add("hidden");
    el.textContent = "";
    return;
  }
  el.textContent = text;
  el.className = ok ? "alert alert-success" : "alert alert-error";
  el.classList.remove("hidden");
}

function switchHubTab(tab) {
  document.querySelectorAll(".hub-tab").forEach(t => {
    t.classList.toggle("active", t.dataset.hubTab === tab);
  });
  document.querySelectorAll(".hub-panel").forEach(p => p.classList.add("hidden"));
  document.getElementById(`hub-panel-${tab}`)?.classList.remove("hidden");
}

function openClientHub(id) {
  const c = clientsCache.find(x => x.id === id);
  if (!c) return;
  hubClientId = id;
  document.getElementById("hub-title").textContent = `Menaxho: ${c.emri}`;
  document.getElementById("modal-client-hub").classList.remove("hidden");
  showHubMsg("");
  switchHubTab("menu");
  loadAdminHubSettings();
  loadAdminMenu();
  fillHubLinks(id);
}

function closeClientHub() {
  hubClientId = null;
  document.getElementById("modal-client-hub")?.classList.add("hidden");
  showHubMsg("");
}

function fillHubLinks(clientId) {
  const features = clientTierFeatures(clientId);
  setHubLinkRow("hub-row-waiter", features.waiter, "hub-link-waiter", waiterLink(clientId));
  setHubLinkRow("hub-row-bar", features.kds, "hub-link-bar", barLink(clientId));
  setHubLinkRow("hub-row-kitchen", features.kds, "hub-link-kitchen", kitchenLink(clientId));
  setHubLinkRow("hub-row-kiosk", features.kiosk, "hub-link-kiosk", kioskTableLink(clientId, 1));
  setHubLinkRow("hub-row-public", features.website, "hub-link-public", publicPageLink(clientId));
  const empty = document.getElementById("hub-links-empty");
  if (empty) {
    const any = features.waiter || features.kds || features.kiosk || features.website;
    empty.classList.toggle("hidden", any);
  }
}

async function loadAdminHubSettings() {
  if (!hubClientId) return;
  try {
    const { settings } = await api(`/api/admin/clients/${hubClientId}/settings`);
    document.getElementById("hub-restaurant-name").value = settings.restaurant_name || "";
    document.getElementById("hub-table-count").value = settings.table_count || 10;
    document.getElementById("hub-address").value = settings.address || "";
    document.getElementById("hub-phone").value = settings.phone || "";
    document.getElementById("hub-nui").value = settings.nui || "";
    document.getElementById("hub-tvsh").value = settings.tvsh_nr || "";
    document.getElementById("hub-receipt-width").value = String(settings.receipt_width_mm || 80);
    document.getElementById("hub-fiscal-nr").value = settings.fiscal_nr || "";
    document.getElementById("hub-fiscal-com").value = settings.fiscal_com_port || "";
    document.getElementById("hub-fiscal-operator").value = settings.fiscal_operator_name || "";
    document.getElementById("hub-fiscal-model").value = settings.fiscal_device_model || "";
    document.getElementById("hub-fiscal-enabled").checked = settings.fiscal_enabled !== false;
  } catch (err) {
    showHubMsg(err.message, false);
  }
}

function renderAdminCategoryList(categories) {
  const list = document.getElementById("hub-category-list");
  if (!list) return;
  list.innerHTML = (categories || []).map(c => `<option value="${escAttr(c)}">`).join("");
}

function renderAdminMenuTable() {
  const body = document.getElementById("hub-menu-body");
  if (!body) return;
  const items = adminMenuCache.items || [];
  if (!items.length) {
    body.innerHTML = '<tr><td colspan="5" style="color:var(--muted)">Nuk ka artikuj — shtoni ose sinkronizoni nga POS.</td></tr>';
    return;
  }
  body.innerHTML = items.map(item => `
    <tr class="${item.active ? "" : "inactive-row"}" data-id="${item.id}">
      <td data-label="Emri"><input type="text" class="hub-edit-name" value="${escAttr(item.name)}"></td>
      <td data-label="Kategoria"><input type="text" class="hub-edit-category" list="hub-category-list" value="${escAttr(item.category)}"></td>
      <td data-label="Çmimi"><input type="number" class="hub-edit-price menu-price-input" min="0" step="0.01" value="${Number(item.price).toFixed(2)}"></td>
      <td data-label="Statusi"><span class="hub-menu-status ${item.active ? "on" : "off"}">${item.active ? "Aktiv" : "Joaktiv"}</span></td>
      <td class="col-actions" data-label="Veprime">
        <div class="hub-row-actions">
          <button type="button" class="btn btn-primary btn-sm hub-save-row">Ruaj</button>
          <button type="button" class="btn btn-ghost btn-sm hub-toggle-row">${item.active ? "Fshih" : "Aktivizo"}</button>
          <button type="button" class="btn btn-danger btn-sm hub-del-row">Fshi</button>
        </div>
      </td>
    </tr>`).join("");

  body.querySelectorAll(".hub-save-row").forEach(btn => {
    btn.addEventListener("click", () => saveAdminMenuRow(btn.closest("tr")));
  });
  body.querySelectorAll(".hub-toggle-row").forEach(btn => {
    btn.addEventListener("click", () => toggleAdminMenuRow(btn.closest("tr")));
  });
  body.querySelectorAll(".hub-del-row").forEach(btn => {
    btn.addEventListener("click", () => deleteAdminMenuRow(btn.closest("tr")));
  });
}

function updateAdminMenuSyncHint(syncedAt) {
  const hint = document.getElementById("hub-menu-sync");
  if (!hint) return;
  if (syncedAt) {
    adminMenuCache.synced_at = syncedAt;
    hint.textContent = `Menuja u përditësua: ${fmtDateTime(syncedAt)} — kamarieri, tavolina, banaku dhe POS e marrin brenda ~15 sek.`;
  } else {
    hint.textContent = "Pas ruajtjes, menuja shfaqet te kamarieri, tavolina dhe banaku.";
  }
}

async function loadAdminMenu() {
  if (!hubClientId) return;
  try {
    const data = await api(`/api/admin/clients/${hubClientId}/menu`);
    adminMenuCache = {
      items: data.items || [],
      categories: data.categories || [],
      synced_at: data.synced_at,
    };
    renderAdminCategoryList(adminMenuCache.categories);
    renderAdminMenuTable();
    updateAdminMenuSyncHint(data.synced_at);
  } catch (err) {
    showHubMsg(err.message, false);
  }
}

async function saveAdminMenuRow(row) {
  if (!row || !hubClientId) return;
  const id = row.dataset.id;
  const name = row.querySelector(".hub-edit-name")?.value?.trim();
  const category = row.querySelector(".hub-edit-category")?.value?.trim();
  const price = Number(row.querySelector(".hub-edit-price")?.value);
  if (!name || !category) {
    showHubMsg("Emri dhe kategoria janë të detyrueshme.", false);
    return;
  }
  try {
    showHubMsg("");
    const { item, synced_at } = await api(`/api/admin/clients/${hubClientId}/menu/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name, category, price }),
    });
    const idx = adminMenuCache.items.findIndex(i => i.id === id);
    if (idx >= 0) adminMenuCache.items[idx] = item;
    if (!adminMenuCache.categories.includes(item.category)) {
      adminMenuCache.categories.push(item.category);
    }
    renderAdminCategoryList(adminMenuCache.categories);
    renderAdminMenuTable();
    updateAdminMenuSyncHint(synced_at);
    showHubMsg("Artikulli u ruajt.", true);
  } catch (err) {
    showHubMsg(err.message, false);
  }
}

async function toggleAdminMenuRow(row) {
  if (!row || !hubClientId) return;
  const id = row.dataset.id;
  const item = adminMenuCache.items.find(i => i.id === id);
  if (!item) return;
  try {
    showHubMsg("");
    const { item: updated, synced_at } = await api(`/api/admin/clients/${hubClientId}/menu/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: !item.active }),
    });
    item.active = updated.active;
    renderAdminMenuTable();
    updateAdminMenuSyncHint(synced_at);
    showHubMsg(updated.active ? "Artikulli u aktivizua." : "Artikulli u fsheh.", true);
  } catch (err) {
    showHubMsg(err.message, false);
  }
}

async function deleteAdminMenuRow(row) {
  if (!row || !hubClientId) return;
  const id = row.dataset.id;
  const name = row.querySelector(".hub-edit-name")?.value?.trim() || "artikullin";
  if (!confirm(`Fshi "${name}" përgjithmonë?`)) return;
  try {
    showHubMsg("");
    const { synced_at } = await api(`/api/admin/clients/${hubClientId}/menu/${id}`, { method: "DELETE" });
    adminMenuCache.items = adminMenuCache.items.filter(i => i.id !== id);
    renderAdminMenuTable();
    updateAdminMenuSyncHint(synced_at);
    showHubMsg("Artikulli u fshi.", true);
  } catch (err) {
    showHubMsg(err.message, false);
  }
}

function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("sq-AL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function openFixLicenseCodes(id) {
  const l = licensesCache.find(x => x.id === id);
  if (!l) return;
  openModal("Rregullo kod & ID pajisje", licensePairFieldsHtml(l, { prefix: "modal-fix" }), async fd => {
    const celesi = String(fd.get("celesi") || "").trim();
    const device_id = String(fd.get("device_id") || "").trim();
    await api(`/api/admin/licenses/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ celesi, device_id }),
    });
    alert(`U ruajt!\n\nKODI: ${celesi}\nID: ${device_id || "— (bosh)"}`);
  });
  setTimeout(() => {
    bindLicenseModalPairActions({
      keyId: "modal-fix-celesi",
      deviceId: "modal-fix-device-id",
      genKeyId: "modal-fix-gen-key",
      genDeviceId: "modal-fix-gen-device",
      genBothId: "modal-fix-gen-both",
    });
  }, 0);
}

function openEditLicense(id) {
  const l = licensesCache.find(x => x.id === id);
  if (!l) return;
  openModal("Ndrysho liçencën", `
    ${licensePairFieldsHtml(l, { prefix: "modal-edit" })}
    <label>Tipi i aplikacionit</label>
    <select name="app_type">
      <option value="restorant" ${(l.app_type || l.clients?.tipi) === "restorant" ? "selected" : ""}>Restorant</option>
      <option value="kafene" ${(l.app_type || l.clients?.tipi) === "kafene" ? "selected" : ""}>Kafene</option>
    </select>
    <label>Kompjuteri (hostname)</label>
    <input value="${esc(l.device_hostname || "—")}" readonly class="mono" style="opacity:0.85">
    <label>Aktivizuar për herë të fundit</label>
    <input value="${esc(fmtDateTime(l.last_activated_at))}" readonly style="opacity:0.85">
    <label>IP e fundit</label>
    <input value="${esc(l.last_ip || "—")}" readonly class="mono" style="opacity:0.85">
    ${l.last_validation_error ? `<div class="alert alert-error" style="margin-bottom:0.75rem">⚠️ ${esc(l.last_validation_error)}</div>` : ""}
    <label>Data e skadimit</label>
    <input type="date" name="data_skadimit" required value="${esc(l.data_skadimit)}">
    <label>Statusi</label>
    <select name="statusi">
      <option value="aktive" ${l.statusi === "aktive" ? "selected" : ""}>aktive</option>
      <option value="skaduar" ${l.statusi === "skaduar" ? "selected" : ""}>skaduar</option>
      <option value="revokuar" ${l.statusi === "revokuar" ? "selected" : ""}>revokuar</option>
      <option value="pezulluar" ${l.statusi === "pezulluar" ? "selected" : ""}>pezulluar</option>
    </select>
    ${licenseTerminalFieldsHtml(l)}
    <p class="field-hint">Terminale aktive: <strong>${terminalCountLabel(l)}</strong></p>
  `, async fd => {
    await api(`/api/admin/licenses/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        celesi: fd.get("celesi"),
        device_id: fd.get("device_id") || "",
        data_skadimit: fd.get("data_skadimit"),
        statusi: fd.get("statusi"),
        app_type: fd.get("app_type"),
        max_terminals: fd.get("max_terminals"),
        base_price: fd.get("base_price"),
        terminal_price: fd.get("terminal_price"),
      }),
    });
  });
  setTimeout(() => {
    const modal = document.getElementById("modal-body");
    if (modal) bindLicensePriceCalc(modal);
    bindLicenseModalPairActions({
      keyId: "modal-edit-celesi",
      deviceId: "modal-edit-device-id",
      genKeyId: "modal-edit-gen-key",
      genDeviceId: "modal-edit-gen-device",
      genBothId: "modal-edit-gen-both",
    });
  }, 0);
}

function openEditOwner(id) {
  const o = ownersCache.find(x => x.id === id);
  if (!o) return;
  openModal("Ndrysho pronarin", `
    <label>Emri *</label>
    <input name="emri" required value="${esc(o.emri)}">
    <label>Email *</label>
    <input type="email" name="email" required value="${esc(o.email)}">
    <label>Fjalëkalimi i ri (lëreni bosh për të mos ndryshuar)</label>
    <input type="password" name="password" minlength="6" placeholder="••••••••" autocomplete="new-password">
    <label>Statusi</label>
    <select name="aktiv">
      <option value="true" ${o.aktiv !== false ? "selected" : ""}>aktiv</option>
      <option value="false" ${o.aktiv === false ? "selected" : ""}>çaktiv</option>
    </select>
  `, async fd => {
    const body = {
      emri: fd.get("emri"),
      email: fd.get("email"),
      aktiv: fd.get("aktiv") === "true",
    };
    const pw = fd.get("password");
    if (pw) body.password = pw;
    await api(`/api/admin/owners/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  });
}

function bindTableActions(scope) {
  scope.querySelectorAll("[data-manage-client]").forEach(btn => {
    btn.onclick = () => openClientHub(btn.dataset.manageClient);
  });
  scope.querySelectorAll("[data-edit-client]").forEach(btn => {
    btn.onclick = () => openEditClient(btn.dataset.editClient);
  });
  scope.querySelectorAll("[data-edit-license]").forEach(btn => {
    btn.onclick = () => openEditLicense(btn.dataset.editLicense);
  });
  scope.querySelectorAll("[data-fix-license]").forEach(btn => {
    btn.onclick = () => openFixLicenseCodes(btn.dataset.fixLicense);
  });
  scope.querySelectorAll("[data-edit-owner]").forEach(btn => {
    btn.onclick = () => openEditOwner(btn.dataset.editOwner);
  });
  scope.querySelectorAll("[data-del-client]").forEach(btn => {
    btn.onclick = () => confirmDelete(
      "Fshi këtë klient? Liçensat dhe pronarët e lidhur do të fshihen gjithashtu.",
      () => api(`/api/admin/clients/${btn.dataset.delClient}`, { method: "DELETE" }),
    );
  });
  scope.querySelectorAll("[data-del-license]").forEach(btn => {
    btn.onclick = () => confirmDelete(
      "Fshi këtë liçencë? Ky veprim nuk kthehet mbrapsht.",
      () => api(`/api/admin/licenses/${btn.dataset.delLicense}`, { method: "DELETE" }),
    );
  });
  scope.querySelectorAll("[data-del-owner]").forEach(btn => {
    btn.onclick = () => confirmDelete(
      "Fshi llogarinë e këtij pronari?",
      () => api(`/api/admin/owners/${btn.dataset.delOwner}`, { method: "DELETE" }),
    );
  });
}

async function loadStats() {
  const s = await api("/api/admin/stats");
  const expiring = Number(s.trials_expiring_soon) || 0;
  const stockClients = Number(s.stock_alert_clients) || 0;
  const terminalClients = Number(s.terminal_limit_clients) || 0;
  document.getElementById("stats").innerHTML = `
    <div class="stat"><div class="val">${s.clients_total}</div><div class="lbl">Klientë</div></div>
    <div class="stat"><div class="val">${s.licenses_total}</div><div class="lbl">Liçensa</div></div>
    <div class="stat"><div class="val">${s.licenses_active}</div><div class="lbl">Aktive</div></div>
    <div class="stat${expiring ? " stat-warn" : ""}"><div class="val">${expiring}</div><div class="lbl">Trial skadon (7 ditë)</div></div>
    <div class="stat${stockClients ? " stat-warn" : ""}"><div class="val">${stockClients}</div><div class="lbl">Stok i ulët</div></div>
    <div class="stat${terminalClients ? " stat-warn" : ""}"><div class="val">${terminalClients}</div><div class="lbl">Limit terminale</div></div>
    <div class="stat"><div class="val">${s.licenses_expired}</div><div class="lbl">Skaduar</div></div>
    <div class="stat"><div class="val">${s.licenses_revoked}</div><div class="lbl">Revokuar</div></div>`;
}

function trialAlertForClient(clientId) {
  return trialAlertsCache.find(a => a.client_id === clientId);
}

function trialBadgeHtml(clientId) {
  const alert = trialAlertForClient(clientId);
  if (!alert) return "";
  if (alert.days_remaining <= 0) {
    return ` <span class="badge badge-trial-expired">Trial skaduar</span>`;
  }
  const label = alert.days_remaining === 1
    ? "Trial nesër"
    : `Trial ${alert.days_remaining} ditë`;
  return ` <span class="badge badge-trial-warning">${label}</span>`;
}

function stockAlertForClient(clientId) {
  return stockAlertsCache.find(a => a.client_id === clientId);
}

function stockBadgeHtml(clientId) {
  const alert = stockAlertForClient(clientId);
  if (!alert) return "";
  const total = (Number(alert.out_count) || 0) + (Number(alert.low_count) || 0);
  if (alert.out_count > 0) {
    return ` <span class="badge badge-stock-out">Stok: ${total}</span>`;
  }
  return ` <span class="badge badge-stock-warning">Stok i ulët: ${total}</span>`;
}

function syncClientsTabBadge() {
  const tabBadge = document.getElementById("tab-klientet-badge");
  if (!tabBadge) return;
  const trialCount = trialAlertsCache.filter(a => a.days_remaining >= 0 && a.days_remaining <= 7).length;
  const stockCount = stockAlertsCache.length;
  const total = trialCount + stockCount;
  if (total > 0) {
    tabBadge.textContent = String(total);
    tabBadge.classList.remove("hidden");
  } else {
    tabBadge.classList.add("hidden");
    tabBadge.textContent = "";
  }
}

function renderTrialExpiryBanner() {
  const el = document.getElementById("trial-expiry-banner");
  if (!el) return;

  const alerts = trialAlertsCache.filter(a => a.days_remaining >= 0 && a.days_remaining <= 7);
  if (!alerts.length) {
    el.classList.add("hidden");
    el.innerHTML = "";
    syncClientsTabBadge();
    return;
  }

  const items = alerts.slice(0, 8).map(a => {
    const when = a.days_remaining === 0
      ? "sot"
      : a.days_remaining === 1
        ? "nesër"
        : `për ${a.days_remaining} ditë`;
    return `<li><strong>${esc(a.client_name)}</strong> — ${esc(a.phone) || "—"} · ${esc(a.package_label)} · skadon ${esc(a.expiry_date)} (${when})</li>`;
  }).join("");

  const more = alerts.length > 8 ? `<p style="margin:0.5rem 0 0;font-size:0.85rem">+ ${alerts.length - 8} të tjerë…</p>` : "";

  el.innerHTML = `
    <strong>⚠️ Trial skadon së shpejti (${alerts.length} klientë)</strong>
    <ul>${items}</ul>
    ${more}`;
  el.classList.remove("hidden");
  syncClientsTabBadge();
}

async function loadTrialAlerts() {
  try {
    const { alerts } = await api("/api/admin/trial-alerts?days=7");
    trialAlertsCache = alerts || [];
  } catch {
    trialAlertsCache = [];
  }
  renderTrialExpiryBanner();
}

async function loadStockAlerts() {
  try {
    const { alerts } = await api("/api/admin/stock-alerts");
    stockAlertsCache = alerts || [];
  } catch {
    stockAlertsCache = [];
  }
  renderStockAlertBanner();
}

function renderStockAlertBanner() {
  const el = document.getElementById("stock-alert-banner");
  if (!el) return;

  const alerts = stockAlertsCache || [];
  if (!alerts.length) {
    el.classList.add("hidden");
    el.innerHTML = "";
    syncClientsTabBadge();
    return;
  }

  const items = alerts.slice(0, 8).map(a => {
    const parts = [];
    if (a.out_count) parts.push(`${a.out_count} mbaruar`);
    if (a.low_count) parts.push(`${a.low_count} i ulët`);
    const sample = (a.items || []).slice(0, 3).map(it => esc(it.name)).join(", ");
    return `<li><strong>${esc(a.client_name)}</strong> — ${parts.join(", ")}${sample ? ` · ${sample}` : ""}</li>`;
  }).join("");

  const more = alerts.length > 8 ? `<p style="margin:0.5rem 0 0;font-size:0.85rem">+ ${alerts.length - 8} klientë të tjerë…</p>` : "";

  el.innerHTML = `
    <strong>📦 Stok i ulët / mbaruar (${alerts.length} lokale)</strong>
    <ul>${items}</ul>
    ${more}`;
  el.classList.remove("hidden");
  syncClientsTabBadge();
}

function showAdminError(text) {
  const el = document.getElementById("admin-load-error");
  if (!el) return;
  if (!text) {
    el.classList.add("hidden");
    el.textContent = "";
    return;
  }
  el.textContent = text;
  el.classList.remove("hidden");
}

async function loadClients() {
  const { clients } = await api("/api/admin/clients");
  clientsCache = (clients || []).map(c => ({
    ...c,
    package_tier: normalizeTierId(c.package_tier),
  }));
  const lmSel = document.getElementById("lm-client");
  const ldSel = document.getElementById("ld-client");
  const clientOpts = clientsCache.length
    ? clientsCache.map(c => `<option value="${c.id}">${esc(c.emri)} (${esc(c.tipi)})</option>`).join("")
    : "";
  const clientSelectHtml = clientsCache.length
    ? '<option value="" disabled selected hidden>Zgjidh klientin…</option>' + clientOpts
    : '<option value="" disabled selected>— Shto klient së pari (+ Shto) —</option>';
  for (const sel of [lmSel, ldSel]) {
    if (!sel) continue;
    sel.innerHTML = clientSelectHtml;
    sel.disabled = !clientsCache.length;
  }
  const tbl = document.getElementById("tbl-clients");
  tbl.innerHTML = clientsCache.length
    ? clientsCache.map(c => `<tr>
        <td data-label="Emri"><strong>${esc(c.emri)}</strong>${trialBadgeHtml(c.id)}${stockBadgeHtml(c.id)}</td>
        <td data-label="Tipi">${esc(c.tipi)}</td>
        <td data-label="Pakoja">${esc(packageTierLabel(c.package_tier))}</td>
        <td data-label="Telefoni">${esc(c.telefoni) || "—"}</td>
        <td data-label="Email">${esc(c.email) || "—"}</td>
        <td data-label="Adresa">${esc(c.adresa) || "—"}</td>
        <td data-label="Liç.">${c.licenses?.[0]?.count ?? 0}</td>
        <td data-label="Regj.">${fmtDate(c.created_at)}</td>
        <td class="kds-link-cell" data-label="Linqet">
          <div class="link-btns">
            <button type="button" class="btn btn-ghost btn-sm" data-copy-waiter="${esc(c.id)}">Kamarier</button>
            <button type="button" class="btn btn-ghost btn-sm" data-copy-bar="${esc(c.id)}">Banak</button>
            <button type="button" class="btn btn-ghost btn-sm" data-copy-kiosk="${esc(c.id)}">Tavolinë</button>
            <button type="button" class="btn btn-ghost btn-sm" data-copy-kitchen="${esc(c.id)}">Kuzhina</button>
          </div>
        </td>
        <td class="actions col-actions" data-label="Veprime">
          <button class="btn btn-primary btn-sm" data-manage-client="${c.id}">Menaxho</button>
          <button class="btn btn-ghost btn-sm" data-edit-client="${c.id}">Ndrysho</button>
          <button class="btn btn-danger btn-sm" data-del-client="${c.id}">Fshi</button>
        </td>
      </tr>`).join("")
    : '<tr><td colspan="10" style="color:var(--muted)">Nuk ka klientë</td></tr>';
  bindTableActions(tbl);
  tbl.querySelectorAll("[data-copy-kitchen]").forEach(btn => {
    btn.addEventListener("click", () => copyKitchenLink(btn.dataset.copyKitchen, btn));
  });
  tbl.querySelectorAll("[data-copy-bar]").forEach(btn => {
    btn.addEventListener("click", () => copyBarLink(btn.dataset.copyBar, btn));
  });
  tbl.querySelectorAll("[data-copy-kiosk]").forEach(btn => {
    btn.addEventListener("click", () => copyKioskLink(btn.dataset.copyKiosk, btn));
  });
  tbl.querySelectorAll("[data-copy-waiter]").forEach(btn => {
    btn.addEventListener("click", () => copyWaiterLink(btn.dataset.copyWaiter, btn));
  });
  return clientsCache;
}

async function copyText(text, btn) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    const prev = btn.textContent;
    btn.textContent = "U kopjua!";
    setTimeout(() => { btn.textContent = prev; }, 1500);
  } catch {
    prompt("Kopjoni:", text);
  }
}

async function saveLicenseDeviceId(licenseId, deviceId, btn) {
  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Duke ruajtur…";
    }
    await api(`/api/admin/licenses/${licenseId}`, {
      method: "PATCH",
      body: JSON.stringify({ device_id: deviceId }),
    });
    await loadLicenses();
    if (btn) {
      btn.textContent = "U ruajt!";
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = "Ruaj ID";
      }, 1200);
    }
  } catch (err) {
    alert(err.message || "Ruajtja e ID-së dështoi.");
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Ruaj ID";
    }
  }
}

async function resetLicenseDevice(licenseId) {
  const lic = licensesCache.find(x => x.id === licenseId);
  const celesi = lic?.celesi || "—";
  if (!confirm(`Hiq ID-në e pajisjes për çelësin ${celesi}?\n\nKlienti duhet të aktivizojë përsëri nga POS.`)) return;
  try {
    await api(`/api/admin/licenses/${licenseId}/reset-device`, { method: "POST" });
    await loadLicenses();
    alert(
      `✅ ID e pajisjes u fshi.\n\n` +
      `Aktivizoni përsëri në POS me çelësin:\n${celesi}\n\n` +
      `ID e re do të shfaqet këtu automatikisht ose vendoseni manualisht.`,
    );
  } catch (err) {
    alert(err.message || "Reset ID dështoi.");
  }
}

function bindLicenseDeviceActions(scope) {
  scope.querySelectorAll("[data-save-device]").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = scope.querySelector(`[data-device-input="${btn.dataset.saveDevice}"]`);
      if (!input) return;
      saveLicenseDeviceId(btn.dataset.saveDevice, input.value.trim(), btn);
    });
  });
  scope.querySelectorAll("[data-gen-device-row]").forEach(btn => {
    btn.addEventListener("click", async () => {
      try {
        const input = scope.querySelector(`[data-device-input="${btn.dataset.genDeviceRow}"]`);
        const device_id = await apiGenerateDeviceId();
        if (input) input.value = device_id;
      } catch (err) {
        alert(err.message || "Gjenerimi dështoi.");
      }
    });
  });
  scope.querySelectorAll("[data-provision-device]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const prev = btn.textContent;
      btn.disabled = true;
      btn.textContent = "…";
      try {
        const res = await api(`/api/admin/licenses/${btn.dataset.provisionDevice}/provision-device`, {
          method: "POST",
        });
        await loadLicenses();
        const lic = licensesCache.find(x => x.id === btn.dataset.provisionDevice);
        const code = res.celesi || lic?.celesi || "—";
        alert(
          (res.created ? "ID u gjenerua dhe u ruajt.\n\n" : "ID ekzistonte:\n\n") +
          `KODI: ${code}\nID: ${res.device_id}`,
        );
      } catch (err) {
        alert(err.message || "Ruajtja dështoi.");
      } finally {
        btn.disabled = false;
        btn.textContent = prev;
      }
    });
  });
}

function bindMobileLicenseActions(scope) {
  scope.querySelectorAll("[data-mobile-copy-key]").forEach(btn => {
    btn.addEventListener("click", () => copyText(btn.dataset.mobileCopyKey, btn));
  });
  scope.querySelectorAll("[data-mobile-copy-device]").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = scope.querySelector(`[data-mobile-device-input="${btn.dataset.mobileCopyDevice}"]`);
      const id = (input?.value || "").trim();
      if (id) copyText(id, btn);
      else alert("Nuk ka ID pajisje.");
    });
  });
  scope.querySelectorAll("[data-mobile-save-device]").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = scope.querySelector(`[data-mobile-device-input="${btn.dataset.mobileSaveDevice}"]`);
      if (!input) return;
      saveLicenseDeviceId(btn.dataset.mobileSaveDevice, input.value.trim(), btn);
    });
  });
  scope.querySelectorAll("[data-mobile-reset-device]").forEach(btn => {
    btn.addEventListener("click", () => resetLicenseDevice(btn.dataset.mobileResetDevice));
  });
  scope.querySelectorAll("[data-mobile-edit-license]").forEach(btn => {
    btn.addEventListener("click", () => openEditLicense(btn.dataset.mobileEditLicense));
  });
  scope.querySelectorAll("[data-mobile-fix-license]").forEach(btn => {
    btn.addEventListener("click", () => openFixLicenseCodes(btn.dataset.mobileFixLicense));
  });
  scope.querySelectorAll("[data-mobile-block-license]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Blloko POS-in e këtij klienti?")) return;
      try {
        const res = await api(`/api/admin/licenses/${btn.dataset.mobileBlockLicense}/block`, { method: "POST" });
        alert(res.message || "POS u bllokua.");
        await loadLicenses();
      } catch (err) {
        alert(err.message || "Bllokimi dështoi.");
      }
    });
  });
  scope.querySelectorAll("[data-mobile-unblock-license]").forEach(btn => {
    btn.addEventListener("click", async () => {
      try {
        await api(`/api/admin/licenses/${btn.dataset.mobileUnblockLicense}/unblock`, { method: "POST" });
        await loadLicenses();
      } catch (err) {
        alert(err.message || "Hapja dështoi.");
      }
    });
  });
  scope.querySelectorAll("[data-mobile-del-license]").forEach(btn => {
    btn.addEventListener("click", () => confirmDelete(
      "Fshi këtë liçencë? Ky veprim nuk kthehet mbrapsht.",
      () => api(`/api/admin/licenses/${btn.dataset.mobileDelLicense}`, { method: "DELETE" }),
    ));
  });
}

function renderMobileLicenseCards(licenses) {
  const list = document.getElementById("license-mobile-list");
  if (!list) return;

  const cardsHtml = licenses.length
    ? licenses.map(l => {
        const devId = licenseDeviceId(l);
        const isBound = l.statusi === "aktive" && devId;
        return `<article class="license-mobile-card${isBound ? " is-bound" : ""}" data-license-id="${l.id}">
          <div class="license-mobile-head">
            <div>
              <strong>${esc(l.clients?.emri) || "—"}</strong>
              <div class="license-mobile-meta">${licenseAppTypeLabel(l)} · ${licenseStatusCell(l)}</div>
            </div>
          </div>
          <div class="license-mobile-pair">
            <div class="license-mobile-field">
              <label>Çelësi i licencës</label>
              <code class="mono-value license-key-value">${esc(l.celesi)}</code>
              <div class="license-mobile-field-actions">
                <button type="button" class="btn btn-ghost btn-sm" data-mobile-copy-key="${esc(l.celesi)}">Kopjo çelësin</button>
              </div>
            </div>
            <div class="license-mobile-field">
              <label>ID e pajisjes</label>
              <input
                type="text"
                class="device-id-input mono"
                data-mobile-device-input="${l.id}"
                value="${esc(devId)}"
                placeholder="Pa aktivizuar — shkruani ID nga POS"
                autocomplete="off"
                autocapitalize="characters"
              >
              <div class="license-mobile-field-actions">
                <button type="button" class="btn btn-primary btn-sm" data-mobile-save-device="${l.id}">Ruaj ID</button>
                <button type="button" class="btn btn-ghost btn-sm" data-mobile-copy-device="${l.id}">Kopjo ID</button>
                <button type="button" class="btn btn-ghost btn-sm" data-mobile-reset-device="${l.id}">Reset ID</button>
              </div>
            </div>
          </div>
          <div class="license-mobile-meta">
            ${l.device_hostname ? `Kompjuteri: ${esc(l.device_hostname)} · ` : ""}
            Terminale: ${terminalCountLabel(l)} · Skadon: ${esc(l.data_skadimit)}
          </div>
          <div class="license-mobile-actions">
            <button type="button" class="btn btn-accent btn-sm" data-mobile-fix-license="${l.id}">Rregullo kod/ID</button>
            <button type="button" class="btn btn-ghost btn-sm" data-mobile-edit-license="${l.id}">Ndrysho liçencën</button>
            ${l.statusi === "aktive"
              ? `<button type="button" class="btn btn-danger btn-sm" data-mobile-block-license="${l.id}">Blloko POS</button>`
              : `<button type="button" class="btn btn-primary btn-sm" data-mobile-unblock-license="${l.id}">Hape POS</button>`}
            <button type="button" class="btn btn-danger btn-sm" data-mobile-del-license="${l.id}">Fshi</button>
          </div>
        </article>`;
      }).join("")
    : '<div class="license-mobile-empty">Nuk ka liçensa — krijoni një më sipër.</div>';

  list.innerHTML = `
    <div class="license-mobile-toolbar">
      <div class="card-title">Liçensat (${licenses.length})</div>
      <button type="button" class="btn btn-ghost btn-sm" id="btn-refresh-licenses-mobile">Rifresko</button>
    </div>
    ${cardsHtml}`;

  bindMobileLicenseActions(list);
  document.getElementById("btn-refresh-licenses-mobile")?.addEventListener("click", async function () {
    const btn = this;
    const prev = btn.textContent;
    btn.disabled = true;
    btn.textContent = "…";
    try {
      await loadLicenses();
    } catch (err) {
      alert(err.message || "Rifreskimi dështoi.");
    } finally {
      btn.disabled = false;
      btn.textContent = prev;
    }
  });
}

async function loadLicenses() {
  const { licenses } = await api("/api/admin/licenses");
  licensesCache = licenses;
  const tbl = document.getElementById("tbl-licenses");
  tbl.innerHTML = licenses.length
    ? licenses.map(l => {
        const devId = licenseDeviceId(l);
        const isActive = l.statusi === "aktive";
        const rowClass = isActive && devId ? "license-row-bound" : "";
        return `<tr class="${rowClass}">
        <td data-label="Klienti">${esc(l.clients?.emri) || "—"} <small style="color:var(--muted)">(${esc(l.clients?.tipi) || ""})</small></td>
        <td data-label="App">${licenseAppTypeLabel(l)}</td>
        <td class="license-key-cell" data-label="Kodi">
          <code class="mono">${esc(l.celesi)}</code>
          <button type="button" class="btn btn-ghost btn-sm" data-copy-text="${esc(l.celesi)}">Kopjo</button>
        </td>
        <td class="device-id-cell" data-label="ID Pajisjes">${licenseDeviceCellHtml(l)}</td>
        <td data-label="Kompjuteri">${esc(l.device_hostname) || "—"}</td>
        <td data-label="Aktivizuar">${fmtDateTime(l.last_activated_at)}</td>
        <td data-label="IP" class="mono">${esc(l.last_ip) || "—"}</td>
        <td data-label="Terminale" class="mono${l.terminal_limit_reached ? " terminal-limit-warn" : ""}">${terminalCountLabel(l)}</td>
        <td data-label="Statusi">${licenseStatusCell(l)}</td>
        <td data-label="Nga">${l.data_fillimit}</td>
        <td data-label="Deri">${l.data_skadimit}</td>
        <td class="actions col-actions" data-label="Veprime">
          <button class="btn btn-accent btn-sm" data-fix-license="${l.id}">Rregullo kod/ID</button>
          <button class="btn btn-ghost btn-sm" data-edit-license="${l.id}">Ndrysho</button>
          ${l.statusi === "aktive"
            ? `<button class="btn btn-danger btn-sm" data-block-license="${l.id}" title="Blloko POS — shkyçet brenda ~60s">Blloko POS</button>`
            : `<button class="btn btn-primary btn-sm" data-unblock-license="${l.id}">Hape POS</button>`}
          <button class="btn btn-ghost btn-sm" data-reset="${l.id}" title="Reset pajisje — instalim në PC të ri">Reset Device</button>
          <button class="btn btn-danger btn-sm" data-del-license="${l.id}">Fshi</button>
        </td>
      </tr>`;
      }).join("")
    : '<tr><td colspan="12" style="color:var(--muted)">Nuk ka liçensa</td></tr>';

  tbl.querySelectorAll("[data-copy-text]").forEach(btn => {
    btn.addEventListener("click", () => copyText(btn.dataset.copyText, btn));
  });
  tbl.querySelectorAll("[data-copy-device-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const lic = licensesCache.find(x => x.id === btn.dataset.copyDeviceId);
      const input = tbl.querySelector(`[data-device-input="${btn.dataset.copyDeviceId}"]`);
      const id = (input?.value || licenseDeviceId(lic)).trim();
      if (id) copyText(id, btn);
      else alert("Nuk ka ID pajisje — shkruani ID nga ekrani POS (Admin → Licenca).");
    });
  });

  bindLicenseDeviceActions(tbl);

  tbl.querySelectorAll("[data-act]").forEach(btn => {
    btn.onclick = async () => {
      await api(`/api/admin/licenses/${btn.dataset.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ statusi: btn.dataset.act }),
      });
      await refreshAll();
    };
  });

  tbl.querySelectorAll("[data-block-license]").forEach(btn => {
    btn.onclick = async () => {
      if (!confirm("Blloko POS-in e këtij klienti? Aplikacioni do të shkyçet brenda ~60 sekondave.")) return;
      try {
        const res = await api(`/api/admin/licenses/${btn.dataset.blockLicense}/block`, { method: "POST" });
        alert(res.message || "POS u bllokua.");
        await refreshAll();
      } catch (err) {
        alert(err.message || "Bllokimi dështoi.");
      }
    };
  });

  tbl.querySelectorAll("[data-unblock-license]").forEach(btn => {
    btn.onclick = async () => {
      try {
        await api(`/api/admin/licenses/${btn.dataset.unblockLicense}/unblock`, { method: "POST" });
        await refreshAll();
      } catch (err) {
        alert(err.message || "Hapja dështoi.");
      }
    };
  });

  tbl.querySelectorAll("[data-reset]").forEach(btn => {
    btn.onclick = async () => {
      await resetLicenseDevice(btn.dataset.reset);
    };
  });
  bindTableActions(tbl);
  renderMobileLicenseCards(licenses);
}

async function loadOwners() {
  const { owners } = await api("/api/admin/owners");
  ownersCache = owners;
  const tbl = document.getElementById("tbl-owners");
  tbl.innerHTML = owners.length
    ? owners.map(o => `<tr>
        <td data-label="Emri"><strong>${esc(o.emri)}</strong></td>
        <td data-label="Email">${esc(o.email)}</td>
        <td data-label="Restoranti">${esc(o.clients?.emri) || "—"} <small style="color:var(--muted)">(${esc(o.clients?.tipi) || ""})</small></td>
        <td data-label="Llogaria">${ownerStatusBadge(o)}</td>
        <td data-label="Regj.">${fmtDate(o.created_at)}</td>
        <td class="actions col-actions" data-label="Veprime">
          <button class="btn btn-ghost btn-sm" data-edit-owner="${o.id}">Ndrysho</button>
          <button class="btn btn-ghost btn-sm" data-reset-owner-pw="${o.id}" title="Dërgo email rivendosjeje / link ftese">Reset Password</button>
          <button class="btn btn-danger btn-sm" data-del-owner="${o.id}">Fshi</button>
        </td>
      </tr>`).join("")
    : '<tr><td colspan="6" style="color:var(--muted)">Nuk ka pronarë</td></tr>';
  tbl.querySelectorAll("[data-reset-owner-pw]").forEach(btn => {
    btn.onclick = async () => {
      if (!confirm("Dërgo email me link/kod rivendosjeje te pronari?")) return;
      try {
        const res = await api(`/api/admin/owners/${btn.dataset.resetOwnerPw}/reset-password`, { method: "POST" });
        alert(res.message || "Email u dërgua.");
        await loadOwners();
        await loadActivityLog().catch(() => {});
      } catch (err) {
        alert(err.message || "Dështoi dërgimi i emailit.");
      }
    };
  });
  bindTableActions(tbl);
}

const ACTION_LABELS = {
  admin_login: "Hyrje admin",
  client_create: "Klient i ri",
  license_block: "Bllokim POS",
  license_unblock: "Hapje POS",
  license_reset_device: "Reset device",
  owner_reset_password: "Reset fjalëkalim pronar",
  owner_invite_resend: "Ftesë pronar",
  emergency_unlock_pin: "Emergjencë PIN",
  emergency_unlock_code: "Emergjencë kod",
};

async function loadEmergencyCode() {
  const hint = document.getElementById("emergency-code-hint");
  const codeEl = document.getElementById("emergency-daily-code");
  if (!hint || !codeEl) return;
  try {
    const data = await api(`/api/admin/emergency-code?_=${Date.now()}`);
    if (!data.configured) {
      hint.textContent = "Vendosni MASTER_EMERGENCY_PIN në Railway për kod emergjence.";
      codeEl.textContent = "—";
      emergencyCodeDate = null;
      return;
    }
    const code = String(data.daily_code || "").trim();
    const dateLabel = data.valid_for_date ? ` · data ${data.valid_for_date}` : "";
    const timeLabel = ` · rifreskuar ${new Date().toLocaleTimeString("sq-AL", { hour: "2-digit", minute: "2-digit" })}`;
    if (code && /[A-F]/i.test(code)) {
      hint.textContent =
        "Serveri online ende i vjetër (kod me germa). Duhet deploy i serverit — pastaj do jetë vetëm 6 numra."
        + dateLabel
        + timeLabel;
    } else {
      hint.textContent =
        (data.hint || "Kodi ditor 6 shifra (vetëm numra) — ndryshon pas mesnatës UTC, jo me çdo rifreskim.")
        + dateLabel
        + timeLabel;
    }
    codeEl.textContent = code || "—";
    emergencyCodeDate = data.valid_for_date || new Date().toISOString().slice(0, 10);
  } catch (e) {
    hint.textContent = e.message || "Nuk u ngarkua kodi emergjence.";
    codeEl.textContent = "—";
    emergencyCodeDate = null;
  }
}

let emergencyCodeDate = null;
setInterval(() => {
  const today = new Date().toISOString().slice(0, 10);
  if (emergencyCodeDate && emergencyCodeDate !== today) {
    loadEmergencyCode().catch(() => {});
  }
}, 60000);

async function loadActivityLog() {
  const tbl = document.getElementById("tbl-activity");
  if (!tbl) return;
  const { logs } = await api("/api/admin/activity-log?limit=120");
  tbl.innerHTML = (logs || []).length
    ? logs.map(row => {
        const details = row.details && Object.keys(row.details).length
          ? esc(JSON.stringify(row.details))
          : "—";
        return `<tr>
          <td data-label="Koha">${fmtDateTime(row.created_at)}</td>
          <td data-label="Veprimi">${esc(ACTION_LABELS[row.action] || row.action)}</td>
          <td data-label="Objekti">${esc(row.target_label || row.target_id || "—")}</td>
          <td data-label="Admin">${esc(row.actor_email || "—")}</td>
          <td data-label="Detaje"><small>${details}</small></td>
        </tr>`;
      }).join("")
    : '<tr><td colspan="5" style="color:var(--muted)">Nuk ka veprime të regjistruara</td></tr>';
}

async function refreshAll() {
  showAdminError(null);
  try {
    await loadPublicConfig();
    await loadPackageTiers();
    await loadTrialAlerts();
    await loadStockAlerts();
    await loadStats();
    await loadClients();
    await loadLicenses();
    await loadOwners();
  } catch (e) {
    showAdminError(`Gabim ngarkimi: ${e.message}. Rifresko faqen (Ctrl+F5).`);
    throw e;
  }
}

function stopLicensesPoll() {
  if (licensesPollTimer) {
    clearInterval(licensesPollTimer);
    licensesPollTimer = null;
  }
}

function startLicensesPoll() {
  stopLicensesPoll();
  licensesPollTimer = setInterval(() => {
    const panel = document.getElementById("panel-licensat");
    if (!panel || panel.classList.contains("hidden")) return;
    loadLicenses().catch(() => {});
  }, 8000);
}

function showApp(user) {
  show("view-login", false);
  show("view-app", true);
  document.getElementById("user-label").textContent = user.emri || user.email;
  setupOwnerLoginUrl();
  setupClientLicensePricing();
}

function setupOwnerLoginUrl() {
  const input = document.getElementById("owner-login-url");
  if (input) input.value = `${publicOrigin()}/owner/login`;
}

function setupClientLicensePricing() {
  const form = document.getElementById("form-client");
  if (form) bindLicensePriceCalc(form, "c");
}

function showLogin() {
  token = "";
  localStorage.removeItem("rip_token");
  closeModal();
  show("view-app", false);
  show("view-login", true);
}

document.getElementById("btn-copy-owner-url")?.addEventListener("click", async function () {
  const input = document.getElementById("owner-login-url");
  if (!input?.value) return;
  try {
    await navigator.clipboard.writeText(input.value);
    const orig = this.textContent;
    this.textContent = "U kopjua!";
    setTimeout(() => { this.textContent = orig; }, 1500);
  } catch {
    input.select();
    document.execCommand("copy");
  }
});

document.getElementById("form-login").addEventListener("submit", async e => {
  e.preventDefault();
  const errEl = document.getElementById("login-error");
  errEl.classList.add("hidden");
  try {
    const res = await fetch(apiUrl("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.gabim || `HTTP ${res.status}`);
    token = data.token;
    localStorage.setItem("rip_token", token);
    showApp(data.user);
    await refreshAll();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove("hidden");
  }
});

document.getElementById("btn-logout").addEventListener("click", async () => {
  try { await api("/api/auth/logout", { method: "POST" }); } catch { /* ignore */ }
  stopLicensesPoll();
  showLogin();
});

document.getElementById("btn-refresh-licenses")?.addEventListener("click", async function () {
  const btn = this;
  const prev = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Duke ngarkuar…";
  try {
    await loadLicenses();
  } catch (err) {
    alert(err.message || "Rifreskimi dështoi.");
  } finally {
    btn.disabled = false;
    btn.textContent = prev;
  }
});

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    document.querySelectorAll(".panel-section").forEach(p => p.classList.add("hidden"));
    document.getElementById(`panel-${tab.dataset.tab}`).classList.remove("hidden");
    if (tab.dataset.tab === "licensat") {
      loadLicenses().catch(() => {});
      prepareLicenseCreateForm().catch(() => {});
      startLicensesPoll();
    } else {
      stopLicensesPoll();
    }
    if (tab.dataset.tab === "logu") {
      loadActivityLog().catch(() => {});
      loadEmergencyCode().catch(() => {});
    }
  });
});

document.getElementById("btn-refresh-emergency")?.addEventListener("click", async () => {
  const btn = document.getElementById("btn-refresh-emergency");
  if (btn) btn.disabled = true;
  try {
    await loadEmergencyCode();
  } catch (err) {
    alert(err.message);
  } finally {
    if (btn) btn.disabled = false;
  }
});

document.getElementById("form-client").addEventListener("submit", async e => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  const loginUrl = `${publicOrigin()}/owner/login`;
  const tipi = document.getElementById("c-tipi").value;
  try {
    const res = await api("/api/admin/clients/onboard", {
      method: "POST",
      body: JSON.stringify({
        emri: document.getElementById("c-emri").value,
        tipi,
        package_tier: normalizeTierId(document.getElementById("c-package-tier").value),
        telefoni: document.getElementById("c-telefoni").value,
        email: document.getElementById("c-email").value,
        adresa: document.getElementById("c-adresa").value,
        app_type: licenseAppTypeFromClientTipi(tipi),
        muaj: document.getElementById("c-muaj").value,
        device_id: document.getElementById("c-device-id")?.value || "",
        max_terminals: document.getElementById("c-max-terminals")?.value || "1",
        base_price: document.getElementById("c-base-price")?.value || "0",
        terminal_price: document.getElementById("c-terminal-price")?.value || "0",
        owner_emri: document.getElementById("c-owner-emri").value,
        owner_email: document.getElementById("c-owner-email").value,
        owner_password: document.getElementById("c-owner-password").value,
      }),
    });
    showMsg(
      "msg-client",
      `Klienti u krijua! Liçenca: ${res.license.celesi}. Pronari hyn në ${loginUrl} me email dhe fjalëkalimin që caktuat.`,
      true,
    );
    e.target.reset();
    populatePackageTierSelect(document.getElementById("c-package-tier"), "pako_1");
    const muajEl = document.getElementById("c-muaj");
    if (muajEl) muajEl.value = "12";
    setupOwnerLoginUrl();
    await safeRefresh();
  } catch (err) {
    showMsg("msg-client", err.message, false);
  } finally {
    btn.disabled = false;
  }
});

document.getElementById("btn-lm-gen-key")?.addEventListener("click", async () => {
  const { celesi } = await api("/api/admin/licenses/generate-key");
  document.getElementById("lm-celesi").value = celesi;
});

document.getElementById("btn-ld-gen-key")?.addEventListener("click", async () => {
  try {
    document.getElementById("ld-celesi").value = await apiGenerateLicenseKey();
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById("btn-ld-gen-device")?.addEventListener("click", async () => {
  try {
    document.getElementById("ld-device-id").value = await apiGenerateDeviceId();
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById("btn-ld-gen-both")?.addEventListener("click", async () => {
  try {
    await fillLicensePair("ld-celesi", "ld-device-id");
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById("btn-lm-gen-device")?.addEventListener("click", async () => {
  try {
    document.getElementById("lm-device-id").value = await apiGenerateDeviceId();
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById("btn-lm-gen-both")?.addEventListener("click", async () => {
  try {
    await fillLicensePair("lm-celesi", "lm-device-id");
  } catch (err) {
    alert(err.message);
  }
});

async function submitLicenseForm({ clientId, appType, celesi, muaj, deviceId, maxTerminals, basePrice, terminalPrice, msgId, resetFields }) {
  const res = await api("/api/admin/licenses", {
    method: "POST",
    body: JSON.stringify({
      client_id: clientId,
      app_type: appType,
      celesi,
      muaj,
      device_id: deviceId || "",
      max_terminals: maxTerminals || "1",
      base_price: basePrice || "0",
      terminal_price: terminalPrice || "0",
    }),
  });
  showMsg(
    msgId,
    `Liçenca u krijua.\nKODI: ${res.license.celesi}${deviceId ? `\nID: ${String(deviceId).trim().toUpperCase()}` : ""}`,
    true,
  );
  resetFields();
  await refreshAll();
}

document.getElementById("form-license-mobile")?.addEventListener("submit", async e => {
  e.preventDefault();
  const clientSel = document.getElementById("lm-client");
  if (!clientSel?.value) {
    showMsg("msg-license-mobile", "Zgjidhni klientin.", false);
    return;
  }
  const client = clientsCache.find(c => c.id === clientSel.value);
  const appType = client?.tipi === "kafene" ? "kafene" : "restorant";
  try {
    await submitLicenseForm({
      clientId: clientSel.value,
      appType,
      celesi: document.getElementById("lm-celesi").value,
      muaj: 12,
      deviceId: document.getElementById("lm-device-id")?.value || "",
      msgId: "msg-license-mobile",
      resetFields: () => {
        document.getElementById("lm-celesi").value = "";
        const devEl = document.getElementById("lm-device-id");
        if (devEl) devEl.value = "";
      },
    });
  } catch (err) {
    showMsg("msg-license-mobile", err.message, false);
  }
});

document.getElementById("form-license-desktop")?.addEventListener("submit", async e => {
  e.preventDefault();
  const clientSel = document.getElementById("ld-client");
  if (!clientSel?.value) {
    showMsg("msg-license-desktop", "Zgjidhni klientin.", false);
    return;
  }
  const client = clientsCache.find(c => c.id === clientSel.value);
  const appType = client?.tipi === "kafene" ? "kafene" : "restorant";
  const celesi = document.getElementById("ld-celesi")?.value?.trim();
  if (!celesi) {
    showMsg("msg-license-desktop", "Gjeneroni ose shkruani çelësin e licencës.", false);
    return;
  }
  let deviceId = document.getElementById("ld-device-id")?.value?.trim() || "";
  if (!deviceId) {
    try {
      deviceId = await apiGenerateDeviceId();
      const devEl = document.getElementById("ld-device-id");
      if (devEl) devEl.value = deviceId;
    } catch (err) {
      showMsg("msg-license-desktop", err.message, false);
      return;
    }
  }
  try {
    await submitLicenseForm({
      clientId: clientSel.value,
      appType,
      celesi,
      muaj: Number(document.getElementById("ld-muaj")?.value) || 12,
      deviceId,
      msgId: "msg-license-desktop",
      resetFields: () => {
        document.getElementById("ld-celesi").value = "";
        const devEl = document.getElementById("ld-device-id");
        if (devEl) devEl.value = "";
      },
    });
  } catch (err) {
    showMsg("msg-license-desktop", err.message, false);
  }
});

document.getElementById("btn-goto-add-client")?.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelector('[data-tab="shto"]')?.classList.add("active");
  document.querySelectorAll(".panel-section").forEach(p => p.classList.add("hidden"));
  document.getElementById("panel-shto")?.classList.remove("hidden");
  document.getElementById("c-emri")?.focus();
});

document.getElementById("hub-close")?.addEventListener("click", closeClientHub);
document.getElementById("hub-backdrop")?.addEventListener("click", closeClientHub);

document.querySelectorAll(".hub-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    switchHubTab(tab.dataset.hubTab);
    if (tab.dataset.hubTab === "linqe" && hubClientId) fillHubLinks(hubClientId);
  });
});

document.getElementById("hub-menu-add")?.addEventListener("click", async () => {
  if (!hubClientId) return;
  const name = document.getElementById("hub-menu-name")?.value?.trim();
  const category = document.getElementById("hub-menu-category")?.value?.trim();
  const price = Number(document.getElementById("hub-menu-price")?.value);
  if (!name || !category) {
    showHubMsg("Shkruani emrin dhe kategorinë.", false);
    return;
  }
  try {
    showHubMsg("");
    const { item, synced_at } = await api(`/api/admin/clients/${hubClientId}/menu`, {
      method: "POST",
      body: JSON.stringify({ name, category, price }),
    });
    adminMenuCache.items.push(item);
    if (!adminMenuCache.categories.includes(item.category)) {
      adminMenuCache.categories.push(item.category);
    }
    document.getElementById("hub-menu-name").value = "";
    document.getElementById("hub-menu-price").value = "";
    renderAdminCategoryList(adminMenuCache.categories);
    renderAdminMenuTable();
    updateAdminMenuSyncHint(synced_at);
    showHubMsg("Artikulli u shtua.", true);
  } catch (err) {
    showHubMsg(err.message, false);
  }
});

document.getElementById("hub-save-biznesi")?.addEventListener("click", async () => {
  if (!hubClientId) return;
  try {
    showHubMsg("");
    await api(`/api/admin/clients/${hubClientId}/settings`, {
      method: "PATCH",
      body: JSON.stringify({
        restaurant_name: document.getElementById("hub-restaurant-name").value.trim(),
        table_count: Number(document.getElementById("hub-table-count").value),
        address: document.getElementById("hub-address").value.trim(),
        phone: document.getElementById("hub-phone").value.trim(),
        nui: document.getElementById("hub-nui").value.trim(),
        tvsh_nr: document.getElementById("hub-tvsh").value.trim(),
        receipt_width_mm: Number(document.getElementById("hub-receipt-width").value),
      }),
    });
    showHubMsg("Settings e biznesit u ruajtën.", true);
  } catch (err) {
    showHubMsg(err.message, false);
  }
});

document.getElementById("hub-save-fiskale")?.addEventListener("click", async () => {
  if (!hubClientId) return;
  try {
    showHubMsg("");
    await api(`/api/admin/clients/${hubClientId}/settings`, {
      method: "PATCH",
      body: JSON.stringify({
        fiscal_nr: document.getElementById("hub-fiscal-nr").value.trim(),
        fiscal_com_port: document.getElementById("hub-fiscal-com").value.trim(),
        fiscal_operator_name: document.getElementById("hub-fiscal-operator").value.trim(),
        fiscal_device_model: document.getElementById("hub-fiscal-model").value.trim(),
        fiscal_enabled: document.getElementById("hub-fiscal-enabled").checked,
      }),
    });
    showHubMsg("Settings fiskale u ruajtën.", true);
  } catch (err) {
    showHubMsg(err.message, false);
  }
});

document.getElementById("hub-regenerate-links")?.addEventListener("click", async () => {
  if (!hubClientId) return;
  if (!confirm("Rigjenero kodet e aksesit? Linqet e vjetra nuk do të funksionojnë.")) return;
  try {
    showHubMsg("");
    await api(`/api/admin/clients/${hubClientId}/regenerate-kitchen-access`, { method: "POST" });
    await loadClients();
    fillHubLinks(hubClientId);
    showHubMsg("Linqet u rigjeneruan.", true);
  } catch (err) {
    showHubMsg(err.message, false);
  }
});

document.querySelectorAll("[data-hub-copy]").forEach(btn => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.hubCopy);
    if (!input?.value) return;
    copyText(input.value, btn);
  });
});

(async () => {
  closeModal();
  if (!token) return;
  try {
    const { user } = await api("/api/auth/me");
    if (user.roli !== "super_admin") throw new Error("Jo super admin");
    showApp(user);
    await refreshAll();
  } catch {
    showLogin();
  }
})();
