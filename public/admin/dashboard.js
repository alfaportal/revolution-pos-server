/* Super Admin desktop dashboard — /admin/dashboard */
let token = localStorage.getItem("rip_token") || "";
let currentUser = null;
let clientsFlat = [];
let sectorsCache = [];
let openSectorIds = new Set();

/** 9 kategoritë — GJITHMONË të dukshme, edhe me (0). */
const FALLBACK_SECTORS = [
  {
    num: 1,
    id: "hospitality",
    label: "Kafene / Restorant / Bar / Piceri / Fast Food / Kebab / Pastiçeri / Ëmbëltore / Akullore / Gjeltore",
    keywords: ["kafene", "restorant", "bar", "piceri", "fast", "food", "kebab", "pasticeri", "embeltore", "akullore", "gjeltore"],
    clients: [],
  },
  { num: 2, id: "bakery", label: "Furrë Buke", keywords: ["furre", "buke"], clients: [] },
  { num: 3, id: "hotel", label: "Hotel Restorant", keywords: ["hotel"], clients: [] },
  { num: 4, id: "nightlife", label: "Bar Nate / Klub", keywords: ["nate", "klub"], clients: [] },
  { num: 5, id: "grocery", label: "Market / Minimarket", keywords: ["market", "minimarket"], clients: [] },
  { num: 6, id: "fashion", label: "Dyqan Rrobash / Këpucësh", keywords: ["rroba", "kepuce", "dyqan"], clients: [] },
  { num: 7, id: "health", label: "Farmaci / Optikë", keywords: ["farmaci", "optike"], clients: [] },
  { num: 8, id: "beauty", label: "Berber / Sallon Bukurie", keywords: ["berber", "sallon"], clients: [] },
  { num: 9, id: "other", label: "Shërbime të tjera", keywords: ["tjeter", "sherbime"], clients: [] },
];

function ensureNineSectors(apiSectors) {
  const byId = new Map((apiSectors || []).map((s) => [s.id, s]));
  const byNum = new Map((apiSectors || []).map((s) => [Number(s.num), s]));
  return FALLBACK_SECTORS.map((fb) => {
    const hit = byId.get(fb.id) || byNum.get(fb.num) || null;
    return {
      num: fb.num,
      id: fb.id,
      label: fb.label,
      keywords: hit?.keywords?.length ? hit.keywords : fb.keywords,
      clients: Array.isArray(hit?.clients) ? hit.clients : [],
    };
  });
}

const TITLES = {
  pasqyra: ["Pasqyra", "Përmbledhje e platformës"],
  klientet: ["Klientët", "9 kategori — gjithmonë të dukshme"],
  licencat: ["Licencat", "Hardware ID, çelësa, aktivizim"],
  ai: ["AI Usage", "Tokena, kosto dhe harxhimi me kohë"],
  faturimi: ["Faturimi", "Fatura PDF — paguar / papaguar"],
  raportet: ["Probleme", "Vetëm probleme — pa shitje"],
  cilesimet: ["Cilësimet", "Admini, çmimet e pakove, AI"],
};

function euro(n) {
  return `${Number(n || 0).toLocaleString("sq-AL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("sq-AL");
  } catch {
    return String(iso);
  }
}

async function api(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const res = await fetch(path, { ...opts, headers, credentials: "include" });
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/pdf") || ct.includes("text/csv")) {
    if (!res.ok) throw new Error("Kërkesa dështoi");
    return res;
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    logout(false);
    throw new Error(data.gabim || "Sesioni skadoi");
  }
  if (!res.ok || data.ok === false) {
    throw new Error(data.gabim || data.message || `Gabim ${res.status}`);
  }
  return data;
}

function showLogin() {
  document.getElementById("view-login").classList.remove("hidden");
  document.getElementById("view-app").classList.add("hidden");
}

function showApp() {
  document.getElementById("view-login").classList.add("hidden");
  document.getElementById("view-app").classList.remove("hidden");
  document.getElementById("user-label").textContent = currentUser?.emri || currentUser?.email || "Super Admin";
}

function logout(callApi = true) {
  token = "";
  localStorage.removeItem("rip_token");
  if (callApi) fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
  showLogin();
}

function closeNav() {
  document.body.classList.remove("nav-open");
}

function openSection(name) {
  document.querySelectorAll(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.section === name));
  document.querySelectorAll(".section").forEach((s) => s.classList.toggle("active", s.id === `sec-${name}`));
  const [t, sub] = TITLES[name] || [name, ""];
  document.getElementById("page-title").textContent = t;
  document.getElementById("page-sub").textContent = sub;
  closeNav();
  if (name === "pasqyra") loadOverview();
  if (name === "klientet") loadClients();
  if (name === "licencat") loadLicenses();
  if (name === "ai") loadAi();
  if (name === "faturimi") loadBilling();
  if (name === "raportet") loadReports();
  if (name === "cilesimet") loadSettings();
  // Sinkron: kur hap Probleme ose Klientët, rifresko të dyja në background
  if (name === "klientet" || name === "raportet") {
    Promise.all([
      name === "raportet" ? loadClients().catch(() => null) : loadReports().catch(() => null),
    ]).catch(() => {});
  }
}

function renderChart(el, points, valueKey = "total") {
  if (!el) return;
  const vals = points.map((p) => Number(p[valueKey]) || 0);
  const max = Math.max(...vals, 1);
  el.innerHTML = points
    .map((p) => {
      const v = Number(p[valueKey]) || 0;
      const h = Math.max(4, Math.round((v / max) * 140));
      const label = String(p.date || "").slice(5);
      return `<div class="chart-bar" title="${esc(p.date)}: ${v}"><div class="fill" style="height:${h}px"></div><div class="lbl">${esc(label)}</div></div>`;
    })
    .join("");
}

async function loadOverview() {
  const d = await api("/api/super/dashboard/overview");
  document.getElementById("kpi-active").textContent = String(d.active_clients ?? 0);
  document.getElementById("kpi-sales").textContent = euro(d.sales_today_total);
  document.getElementById("kpi-problems").textContent = String((d.problem_clients || []).length);
  renderChart(document.getElementById("chart-weekly"), d.weekly_sales || [], "total");
  const list = document.getElementById("problem-list");
  const problems = d.problem_clients || [];
  list.innerHTML = problems.length
    ? problems
        .map(
          (p) => `<li>
            <div><strong>${esc(p.emri)}</strong><div style="color:var(--muted);font-size:0.8rem">${esc(p.tipi_label)}</div></div>
            <div>${(p.reasons || []).map((r) => `<span class="badge badge-warn">${esc(r)}</span>`).join(" ")}</div>
          </li>`,
        )
        .join("")
    : `<li style="color:var(--muted)">Nuk ka klientë me probleme.</li>`;
}

function normalizeSearch(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ë/g, "e");
}

function renderClientsSectors(filterText = "") {
  const root = document.getElementById("clients-sectors");
  if (!root) return;
  const q = normalizeSearch(filterText);
  clientsFlat = [];
  // GJITHMONË 9 — mos fshih kategoritë bosh
  const sectors = ensureNineSectors(sectorsCache);

  const html = sectors
    .map((s) => {
      const sectorBlob = normalizeSearch(`${s.num} ${s.label} ${(s.keywords || []).join(" ")}`);
      const sectorMatch = !q || sectorBlob.includes(q) || q.split(/\s+/).some((w) => w && sectorBlob.includes(w));

      let clients = s.clients || [];
      if (q) {
        const nameHits = clients.filter((c) =>
          normalizeSearch(`${c.emri} ${c.tipi_label} ${c.package_label}`).includes(q),
        );
        if (sectorMatch) clients = nameHits.length ? nameHits : clients;
        else clients = nameHits;
        // Gjatë kërkimit: fsheh vetëm nëse as sektori as klientët nuk përputhen
        if (!clients.length && !sectorMatch) return "";
      }

      clientsFlat.push(...clients);
      const isOpen = openSectorIds.has(s.id) || Boolean(q && (sectorMatch || clients.length));
      const rows = clients
        .map(
          (c) => `<div class="client-row" data-client-id="${esc(c.id)}">
            <div class="client-meta">
              <strong>${esc(c.emri)}</strong>
              <span>${esc(c.tipi_label)} · ${esc(c.package_label)}${c.package_contents ? ` — ${esc(c.package_contents)}` : ""}</span>
            </div>
            <span class="badge ${c.status === "aktiv" ? "badge-ok" : "badge-off"}">${esc(c.status)}</span>
          </div>`,
        )
        .join("");

      return `<div class="sector ${isOpen ? "open" : ""}" data-sector-id="${esc(s.id)}">
        <button type="button" class="sector-head" data-toggle-sector="${esc(s.id)}">
          <span class="sector-num">${s.num}</span>
          <span class="sector-label">${esc(s.label)}</span>
          <span class="sector-count">(${clients.length})</span>
        </button>
        <div class="sector-body">
          ${rows || '<p style="color:var(--muted);padding:0.75rem;font-size:1.05rem">Nuk ka klientë ende.</p>'}
        </div>
      </div>`;
    })
    .filter(Boolean)
    .join("");

  // Pa kërkim: gjithmonë 9 butona. Me kërkim pa hit: mesazh.
  root.innerHTML = html || '<p style="color:var(--muted);font-size:1.1rem;padding:0.5rem">Asnjë rezultat.</p>';

  root.querySelectorAll("[data-toggle-sector]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.toggleSector;
      const el = btn.closest(".sector");
      const open = el.classList.toggle("open");
      if (open) openSectorIds.add(id);
      else openSectorIds.delete(id);
    });
  });
  root.querySelectorAll("[data-client-id]").forEach((row) => {
    row.addEventListener("click", () => openClientDetail(row.dataset.clientId));
  });

  const sel = document.getElementById("inv-client");
  if (sel) {
    const all = ensureNineSectors(sectorsCache).flatMap((s) => s.clients || []);
    sel.innerHTML = all
      .map((c) => `<option value="${esc(c.id)}">${esc(c.emri)} (${esc(c.tipi_label)})</option>`)
      .join("");
  }
}

async function loadClients() {
  try {
    const d = await api("/api/super/dashboard/clients");
    sectorsCache = ensureNineSectors(d.sectors || d.groups || []);
  } catch {
    sectorsCache = ensureNineSectors([]);
  }
  const q = document.getElementById("clients-search")?.value || "";
  renderClientsSectors(q);
}

async function copyText(text, btn) {
  const val = String(text || "").trim();
  if (!val || val === "—") return;
  try {
    await navigator.clipboard.writeText(val);
    if (btn) {
      const prev = btn.textContent;
      btn.textContent = "Kopjuar ✓";
      setTimeout(() => {
        btn.textContent = prev;
      }, 1200);
    }
  } catch {
    prompt("Kopjo:", val);
  }
}

async function openClientDetail(id) {
  const d = await api(`/api/super/dashboard/clients/${id}`);
  const c = d.client || {};
  document.getElementById("drawer-root").classList.remove("hidden");
  document.getElementById("drawer-title").textContent = `${c.icon || "🏪"} ${c.emri || "Klient"}`;
  document.getElementById("drawer-sub").textContent = `${c.tipi_label || ""} · ${c.package_label || ""} · ${c.email || ""}`;
  const sales = d.sales || {};
  const stock = d.stock || {};
  const waiters = d.waiters || [];
  const licenses = d.licenses || [];
  const ai = d.ai_usage || {};
  document.getElementById("drawer-body").innerHTML = `
    <div class="detail-block">
      <h4>Shitjet</h4>
      <div>Sot: <strong>${euro(sales.today)}</strong></div>
      <div>30 ditë: <strong>${euro(sales.last_30_days)}</strong> (${sales.order_count_30d || 0} porosi)</div>
    </div>
    <div class="detail-block">
      <h4>Stoku</h4>
      <div>Artikuj me stok zero: <strong>${stock.zero_count || 0}</strong></div>
      <ul style="margin:0.4rem 0 0;padding-left:1.1rem;color:var(--muted);font-size:0.85rem">
        ${(stock.zero_items || []).slice(0, 12).map((i) => `<li>${esc(i.name)}</li>`).join("") || "<li>—</li>"}
      </ul>
    </div>
    <div class="detail-block">
      <h4>Kamarierët</h4>
      <ul style="margin:0;padding-left:1.1rem">
        ${waiters.map((w) => `<li>${esc(w.name)} ${w.active === false ? "(joaktiv)" : ""}</li>`).join("") || "<li>—</li>"}
      </ul>
    </div>
    <div class="detail-block">
      <h4>Licenca</h4>
      ${licenses
        .map(
          (l) => `<div class="lic-detail-row" style="margin-bottom:0.75rem">
            <span class="badge ${l.statusi === "aktive" ? "badge-ok" : "badge-bad"}">${esc(l.statusi)}</span>
            <div class="mono">HW: ${esc(l.device_id || "—")}</div>
            <div class="mono">Key: ${esc(l.celesi || "—")}</div>
            <div style="color:var(--muted);font-size:0.85rem;margin:0.2rem 0">Skadon: ${esc(l.data_skadimit || "—")}</div>
            <div class="prob-actions" style="margin-top:0.4rem">
              <button type="button" class="btn btn-ghost btn-sm" data-drawer-extend="${esc(l.id)}" data-months="1">+1 muaj</button>
              <button type="button" class="btn btn-ghost btn-sm" data-drawer-extend="${esc(l.id)}" data-months="3">+3 muaj</button>
              <button type="button" class="btn btn-primary btn-sm" data-drawer-extend="${esc(l.id)}" data-months="12">+12 muaj</button>
              ${
                ["pezulluar", "revokuar"].includes(String(l.statusi || ""))
                  ? `<button type="button" class="btn btn-ghost btn-sm" data-drawer-unblock="${esc(l.id)}">Zhblloko</button>`
                  : ""
              }
            </div>
          </div>`,
        )
        .join("") || "<div>—</div>"}
    </div>
    <div class="detail-block">
      <h4>AI Usage (muaji aktual)</h4>
      <div>Tokena: <strong>${Number(ai.tokens_total || 0).toLocaleString("sq-AL")}</strong></div>
      <div>Kosto: <strong>${euro(ai.cost_eur_total)}</strong></div>
      <div>Thirrje: <strong>${ai.calls || 0}</strong></div>
    </div>
  `;
  bindDrawerLicenseFix(document.getElementById("drawer-body"), id);
}

function bindDrawerLicenseFix(root, clientId) {
  if (!root) return;
  root.querySelectorAll("[data-drawer-extend]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const months = Number(btn.dataset.months) || 12;
      if (!confirm(`Zgjato licencën me ${months} muaj?`)) return;
      btn.disabled = true;
      try {
        const r = await api(`/api/super/dashboard/licenses/${btn.dataset.drawerExtend}/extend`, {
          method: "POST",
          body: JSON.stringify({ months }),
        });
        alert(`Licenca u zgjat deri më ${r.data_skadimit || "—"}.`);
        await refreshClientsAndProblems();
        if (clientId) await openClientDetail(clientId);
      } catch (ex) {
        alert(ex.message || "Zgjatja dështoi.");
      } finally {
        btn.disabled = false;
      }
    });
  });
  root.querySelectorAll("[data-drawer-unblock]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Zhblloko licencën?")) return;
      btn.disabled = true;
      try {
        await api(`/api/super/dashboard/licenses/${btn.dataset.drawerUnblock}/unblock`, {
          method: "POST",
        });
        await refreshClientsAndProblems();
        if (clientId) await openClientDetail(clientId);
      } catch (ex) {
        alert(ex.message || "Zhbllokimi dështoi.");
      } finally {
        btn.disabled = false;
      }
    });
  });
}

function closeDrawer() {
  document.getElementById("drawer-root").classList.add("hidden");
}

function bindLicenseActions(root) {
  if (!root) return;
  root.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const sel = btn.dataset.copyFrom;
      const val = sel ? String(root.querySelector(sel)?.value || "").trim() : btn.dataset.copy;
      copyText(val || "", btn);
    });
  });
  root.querySelectorAll("[data-block]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Çaktivizo licencën?")) return;
      await api(`/api/super/dashboard/licenses/${btn.dataset.block}/block`, { method: "POST" });
      loadLicenses();
    });
  });
  root.querySelectorAll("[data-unblock]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await api(`/api/super/dashboard/licenses/${btn.dataset.unblock}/unblock`, { method: "POST" });
      loadLicenses();
    });
  });
  root.querySelectorAll("[data-gen-from-hw]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.genFromHw;
      const hwEl = root.querySelector(`[data-hw-input="${id}"]`);
      const keyEl = root.querySelector(`[data-key-input="${id}"]`);
      const hardwareId = String(hwEl?.value || "").trim();
      if (!hardwareId) {
        alert("Shkruaj Hardware ID (nga ekrani Aktivizo KAFENE).");
        hwEl?.focus();
        return;
      }
      btn.disabled = true;
      try {
        const licenseType =
          String(document.getElementById("gen-license-type")?.value || "annual").toLowerCase() ===
          "trial"
            ? "trial"
            : "annual";
        let data;
        try {
          data = await api("/api/admin/licenses/generate-hardware-key", {
            method: "POST",
            body: JSON.stringify({ hardwareId, licenseType }),
          });
        } catch {
          data = await api("/api/super/generate-license-key", {
            method: "POST",
            body: JSON.stringify({ hardwareId, licenseType }),
          });
        }
        const key = data.licenseKey || data.celesi || "";
        if (data.hardwareId && hwEl) hwEl.value = data.hardwareId;
        if (keyEl) {
          keyEl.value = key;
          keyEl.focus();
          keyEl.select();
        }
        const typeLabel = data.licenseType === "trial" ? "Trial (7 ditë)" : "Vjetor";
        const exp =
          data.licenseType === "trial"
            ? "7 ditë nga aktivizimi"
            : data.expiresAt
              ? `skadon ${data.expiresAt}`
              : "";
        alert(`U gjenerua: ${typeLabel}\nLICENSE_KEY: ${key}${exp ? `\n${exp}` : ""}`);
      } catch (ex) {
        alert(ex.message || "Gjenerimi dështoi.");
      } finally {
        btn.disabled = false;
      }
    });
  });
  root.querySelectorAll("[data-save-license]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.saveLicense;
      const card = btn.closest("[data-license-card]") || root;
      const hwEl = root.querySelector(`[data-hw-input="${id}"]`);
      const keyEl = root.querySelector(`[data-key-input="${id}"]`);
      const msgEl = card.querySelector(`[data-save-msg="${id}"]`) || root.querySelector(`[data-save-msg="${id}"]`);
      const device_id = String(hwEl?.value || "").trim();
      const celesi = String(keyEl?.value || "").trim();
      if (!celesi) {
        if (msgEl) {
          msgEl.textContent = "Shkruaj ose gjenero License Key.";
          msgEl.classList.add("err");
        } else {
          alert("Shkruaj ose gjenero License Key.");
        }
        keyEl?.focus();
        return;
      }
      btn.disabled = true;
      const prev = btn.textContent;
      btn.textContent = "Duke ruajtur…";
      if (msgEl) {
        msgEl.textContent = "";
        msgEl.classList.remove("err");
      }
      try {
        await api(`/api/admin/licenses/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ celesi, device_id }),
        });
        btn.textContent = "U ruajt ✓";
        if (msgEl) {
          msgEl.classList.remove("err");
          msgEl.textContent = "Sistemi e ruajti ID + License Key.";
        }
        setTimeout(() => {
          btn.textContent = prev;
          btn.disabled = false;
        }, 1500);
      } catch (ex) {
        btn.textContent = prev;
        btn.disabled = false;
        const err = ex.message || "Ruajtja dështoi.";
        if (msgEl) {
          msgEl.classList.add("err");
          msgEl.textContent = err;
        } else {
          alert(err);
        }
      }
    });
  });
  root.querySelectorAll("[data-hw-input]").forEach((el) => {
    if (el.dataset.fmtBound === "1") return;
    el.dataset.fmtBound = "1";
    el.addEventListener("input", () => {
      const hex = String(el.value || "").replace(/[^a-fA-F0-9]/g, "").toUpperCase().slice(0, 16);
      let next = hex;
      if (hex.length > 12) next = `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12)}`;
      else if (hex.length > 8) next = `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8)}`;
      else if (hex.length > 4) next = `${hex.slice(0, 4)}-${hex.slice(4)}`;
      if (next !== el.value) el.value = next;
    });
  });
}

async function loadLicenses() {
  const d = await api("/api/super/dashboard/licenses");
  const list = d.licenses || [];

  const cards = document.getElementById("licenses-cards");
  if (cards) {
    cards.innerHTML = list.length
      ? list
          .map((l) => {
            const active = l.statusi === "aktive";
            const hw = l.hardware_id && l.hardware_id !== "—" ? l.hardware_id : "";
            const key = l.license_key && l.license_key !== "—" ? l.license_key : "";
            return `<div class="license-card" data-license-card="${esc(l.id)}">
              <h4>${esc(l.client_name)}
                <span class="badge ${active ? "badge-ok" : "badge-bad"}" style="margin-left:0.35rem">${esc(l.statusi)}</span>
              </h4>
              <div style="color:var(--muted);font-size:0.95rem;margin-bottom:0.35rem">Aktivizimi: ${esc(fmtDate(l.activated_at))}</div>
              <div class="lic-field-block">
                <label class="lic-field-label">Hardware ID (vetëm ID)</label>
                <input type="text" class="lic-edit-input mono" data-hw-input="${esc(l.id)}" value="${esc(hw)}" placeholder="XXXX-XXXX-XXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false" inputmode="text">
                <div class="lic-field-actions">
                  <button type="button" class="btn btn-ghost btn-copy" data-copy-from="[data-hw-input='${esc(l.id)}']">Kopjo ID</button>
                </div>
              </div>
              <div class="lic-field-block">
                <label class="lic-field-label">License Key (vetëm licenca)</label>
                <input type="text" class="lic-edit-input mono" data-key-input="${esc(l.id)}" value="${esc(key)}" placeholder="XXXX-XXXX-XXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false" inputmode="text">
                <div class="lic-field-actions">
                  <button type="button" class="btn btn-ghost btn-copy" data-copy-from="[data-key-input='${esc(l.id)}']">Kopjo licencën</button>
                </div>
              </div>
              <div class="lic-card-actions">
                <button type="button" class="btn btn-primary" data-gen-from-hw="${esc(l.id)}">Gjenero kod nga ID</button>
                <button type="button" class="btn btn-ok" data-save-license="${esc(l.id)}">Ruaj ID + kod</button>
                <p class="lic-save-msg" data-save-msg="${esc(l.id)}"></p>
                ${
                  active
                    ? `<button type="button" class="btn btn-danger" data-block="${esc(l.id)}">Çaktivizo</button>`
                    : `<button type="button" class="btn btn-ghost" data-unblock="${esc(l.id)}">Riaktivizo</button>`
                }
              </div>
            </div>`;
          })
          .join("")
      : `<p style="color:var(--muted);font-size:1.05rem">Nuk ka licenca</p>`;
    bindLicenseActions(cards);
  }

  const body = document.getElementById("licenses-body");
  if (body) {
    body.innerHTML = list
      .map((l) => {
        const active = l.statusi === "aktive";
        const hw = l.hardware_id && l.hardware_id !== "—" ? l.hardware_id : "";
        const key = l.license_key && l.license_key !== "—" ? l.license_key : "";
        return `<tr>
          <td>${esc(l.client_name)}</td>
          <td>
            <input type="text" class="lic-edit-input mono" data-hw-input="${esc(l.id)}" value="${esc(hw)}" placeholder="XXXX-XXXX-XXXX-XXXX" autocomplete="off" spellcheck="false" title="Vetëm Hardware ID">
            <button type="button" class="btn btn-ghost btn-sm btn-copy" style="margin-top:0.35rem" data-copy-from="[data-hw-input='${esc(l.id)}']">Kopjo ID</button>
          </td>
          <td>
            <input type="text" class="lic-edit-input mono" data-key-input="${esc(l.id)}" value="${esc(key)}" placeholder="XXXX-XXXX-XXXX-XXXX" autocomplete="off" spellcheck="false" title="Vetëm License Key">
            <button type="button" class="btn btn-ghost btn-sm btn-copy" style="margin-top:0.35rem" data-copy-from="[data-key-input='${esc(l.id)}']">Kopjo licencën</button>
          </td>
          <td><span class="badge ${active ? "badge-ok" : "badge-bad"}">${esc(l.statusi)}</span></td>
          <td>${esc(fmtDate(l.activated_at))}</td>
          <td style="white-space:nowrap">
            <button type="button" class="btn btn-primary btn-sm" data-gen-from-hw="${esc(l.id)}">Gjenero</button>
            <button type="button" class="btn btn-ok btn-sm" data-save-license="${esc(l.id)}">Ruaj</button>
            <p class="lic-save-msg" data-save-msg="${esc(l.id)}"></p>
            ${
              active
                ? `<button type="button" class="btn btn-danger btn-sm" data-block="${esc(l.id)}">Çaktivizo</button>`
                : `<button type="button" class="btn btn-ghost btn-sm" data-unblock="${esc(l.id)}">Riaktivizo</button>`
            }
          </td>
        </tr>`;
      })
      .join("") || `<tr><td colspan="6" style="color:var(--muted)">Nuk ka licenca</td></tr>`;
    bindLicenseActions(body);
  }
}

async function loadAi() {
  const monthEl = document.getElementById("ai-month");
  if (monthEl && !monthEl.value) {
    const now = new Date();
    monthEl.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }
  const qs = monthEl?.value ? `?month=${encodeURIComponent(monthEl.value)}` : "";
  const d = await api(`/api/super/dashboard/ai-usage${qs}`);
  document.getElementById("ai-tokens-total").textContent = Number(d.totals?.tokens_total || 0).toLocaleString("sq-AL");
  document.getElementById("ai-cost-total").textContent = euro(d.totals?.cost_eur_total);
  document.getElementById("ai-calls-total").textContent = String(d.totals?.calls || 0);
  renderChart(document.getElementById("chart-ai"), d.timeline || [], "tokens");
  document.getElementById("ai-body").innerHTML = (d.rows || [])
    .map(
      (r) => `<tr>
        <td>${esc(r.local_name)}</td>
        <td>${Number(r.tokens_total || 0).toLocaleString("sq-AL")}</td>
        <td>${euro(r.cost_eur_total)}</td>
        <td>${r.calls || 0}</td>
        <td>${esc(fmtDate(r.last_used_at))}</td>
      </tr>`,
    )
    .join("") || `<tr><td colspan="5" style="color:var(--muted)">Nuk ka përdorim AI</td></tr>`;
}

async function loadBilling() {
  if (!clientsFlat.length) {
    try {
      await loadClients();
    } catch {
      /* ignore */
    }
  }
  const today = new Date();
  const from = new Date(today);
  from.setDate(1);
  const invFrom = document.getElementById("inv-from");
  const invTo = document.getElementById("inv-to");
  if (invFrom && !invFrom.value) invFrom.value = from.toISOString().slice(0, 10);
  if (invTo && !invTo.value) invTo.value = today.toISOString().slice(0, 10);

  const d = await api("/api/super/dashboard/billing/invoices");
  document.getElementById("inv-body").innerHTML = (d.invoices || [])
    .map(
      (inv) => `<tr>
        <td class="mono">${esc(inv.id)}</td>
        <td>${esc(inv.client_name)}</td>
        <td>${esc(inv.period_from)} — ${esc(inv.period_to)}</td>
        <td>${euro(inv.total)}</td>
        <td><span class="badge ${inv.status === "paguar" ? "badge-ok" : "badge-warn"}">${esc(inv.status)}</span></td>
        <td style="white-space:nowrap">
          <button type="button" class="btn btn-ghost btn-sm" data-pdf="${esc(inv.id)}">PDF</button>
          <button type="button" class="btn btn-sm ${inv.status === "paguar" ? "btn-ghost" : "btn-ok"}" data-status="${esc(inv.id)}" data-next="${inv.status === "paguar" ? "papaguar" : "paguar"}">
            ${inv.status === "paguar" ? "Papaguar" : "Paguar"}
          </button>
        </td>
      </tr>`,
    )
    .join("") || `<tr><td colspan="6" style="color:var(--muted)">Nuk ka fatura ende</td></tr>`;

  document.querySelectorAll("[data-pdf]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const res = await api(`/api/super/dashboard/billing/invoices/${btn.dataset.pdf}/pdf`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    });
  });
  document.querySelectorAll("[data-status]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await api(`/api/super/dashboard/billing/invoices/${btn.dataset.status}`, {
        method: "PATCH",
        body: JSON.stringify({ status: btn.dataset.next }),
      });
      loadBilling();
    });
  });
}

function problemActionsHtml(p) {
  const bits = [];
  if (p.id) {
    bits.push(
      `<button type="button" class="btn btn-ghost btn-sm" data-prob-open="${esc(p.id)}">Hap klientin</button>`,
    );
  }
  if (p.license_id) {
    bits.push(
      `<button type="button" class="btn btn-ghost btn-sm" data-prob-extend="${esc(p.license_id)}" data-months="1">+1 muaj</button>`,
    );
    bits.push(
      `<button type="button" class="btn btn-ghost btn-sm" data-prob-extend="${esc(p.license_id)}" data-months="3">+3 muaj</button>`,
    );
    bits.push(
      `<button type="button" class="btn btn-primary btn-sm" data-prob-extend="${esc(p.license_id)}" data-months="12">+12 muaj</button>`,
    );
    if (["pezulluar", "revokuar"].includes(String(p.statusi || ""))) {
      bits.push(
        `<button type="button" class="btn btn-ghost btn-sm" data-prob-unblock="${esc(p.license_id)}">Zhblloko</button>`,
      );
    }
  }
  if (!bits.length) return "";
  return `<div class="prob-actions">${bits.join("")}</div>`;
}

function renderProblemList(elId, rows, emptyText) {
  const el = document.getElementById(elId);
  if (!el) return;
  const list = rows || [];
  el.innerHTML = list.length
    ? list
        .map(
          (p) => `<li class="prob-row">
            <div class="prob-main">
              <strong>${esc(p.emri)}</strong>
              <div style="color:var(--muted);font-size:0.8rem">${esc(p.tipi_label || "")}${p.at ? ` · ${esc(fmtDate(p.at))}` : ""}${p.data_skadimit ? ` · skadon ${esc(p.data_skadimit)}` : ""}</div>
              <div style="margin-top:0.25rem;font-size:0.9rem">${esc(p.detail || "")}</div>
              ${problemActionsHtml(p)}
            </div>
          </li>`,
        )
        .join("")
    : `<li style="color:var(--muted)">${esc(emptyText)}</li>`;
  bindProblemActions(el);
}

function bindProblemActions(root) {
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";
  root.addEventListener("click", async (e) => {
    const openBtn = e.target.closest("[data-prob-open]");
    if (openBtn) {
      e.preventDefault();
      try {
        await openClientDetail(openBtn.dataset.probOpen);
      } catch (ex) {
        alert(ex.message || "Nuk u hap klienti.");
      }
      return;
    }
    const unblockBtn = e.target.closest("[data-prob-unblock]");
    if (unblockBtn) {
      e.preventDefault();
      if (!confirm("Zhblloko licencën?")) return;
      unblockBtn.disabled = true;
      try {
        await api(`/api/super/dashboard/licenses/${unblockBtn.dataset.probUnblock}/unblock`, {
          method: "POST",
        });
        await refreshClientsAndProblems();
      } catch (ex) {
        alert(ex.message || "Zhbllokimi dështoi.");
      } finally {
        unblockBtn.disabled = false;
      }
      return;
    }
    const extBtn = e.target.closest("[data-prob-extend]");
    if (extBtn) {
      e.preventDefault();
      const months = Number(extBtn.dataset.months) || 12;
      if (!confirm(`Zgjato licencën me ${months} muaj?`)) return;
      extBtn.disabled = true;
      try {
        const r = await api(`/api/super/dashboard/licenses/${extBtn.dataset.probExtend}/extend`, {
          method: "POST",
          body: JSON.stringify({ months }),
        });
        alert(`Licenca u zgjat deri më ${r.data_skadimit || "—"}.`);
        await refreshClientsAndProblems();
      } catch (ex) {
        alert(ex.message || "Zgjatja dështoi.");
      } finally {
        extBtn.disabled = false;
      }
    }
  });
}

function jumpToProblemCard(kind) {
  document.querySelectorAll(".kpi-jump").forEach((b) => {
    b.classList.toggle("active", b.dataset.probJump === kind);
  });
  document.querySelectorAll("[data-prob-card]").forEach((card) => {
    const on = card.dataset.probCard === kind;
    card.classList.toggle("prob-card-focus", on);
  });
  const card = document.querySelector(`[data-prob-card="${kind}"]`);
  if (card) {
    card.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function refreshClientsAndProblems(btn) {
  const buttons = btn
    ? [btn]
    : [
        document.getElementById("btn-rep-load"),
        document.getElementById("btn-refresh-clients"),
      ].filter(Boolean);
  buttons.forEach((b) => {
    b.disabled = true;
    b.dataset.prevLabel = b.textContent;
    b.textContent = "Duke rifreskuar…";
  });
  try {
    await Promise.all([loadClients().catch(() => null), loadReports()]);
  } finally {
    buttons.forEach((b) => {
      b.disabled = false;
      b.textContent = b.dataset.prevLabel || "Rifresko";
    });
  }
}

const PROBLEM_KIND_LABEL = {
  program: "Program",
  offline: "Offline",
  print: "Print",
  fiscal: "Fiskale",
  license: "Licencë",
};

async function loadReports() {
  const d = await api("/api/super/dashboard/problems").catch(() =>
    api("/api/super/dashboard/reports"),
  );
  const c = d.counts || {};
  const set = (id, n) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(n ?? 0);
  };
  set("prob-kpi-program", c.program);
  set("prob-kpi-offline", c.offline_48h);
  set("prob-kpi-license", c.license_expired);
  set("prob-kpi-print", c.print_errors);
  set("prob-kpi-fiscal", c.fiscal_errors);

  renderProblemList("prob-program", d.program, "Nuk ka probleme me programin.");
  renderProblemList("prob-offline", d.offline_48h, "Nuk ka klientë offline >48h.");
  renderProblemList("prob-license", d.license_expired, "Nuk ka licenca të skaduara.");
  renderProblemList("prob-print", d.print_errors, "Nuk ka gabime printimi.");
  renderProblemList("prob-fiscal", d.fiscal_errors, "Nuk ka gabime fiskale.");

  const body = document.getElementById("prob-history-body");
  if (body) {
    const hist = d.history || [];
    body.innerHTML = hist.length
      ? hist
          .map(
            (h) => `<tr>
              <td>${esc(fmtDate(h.at))}</td>
              <td>${esc(h.client_name || "—")}</td>
              <td><span class="badge badge-warn">${esc(PROBLEM_KIND_LABEL[h.kind] || h.kind || "—")}</span></td>
              <td>${esc(h.message || h.event || "—")}</td>
            </tr>`,
          )
          .join("")
      : `<tr><td colspan="4" style="color:var(--muted)">Nuk ka histori problemesh ende.</td></tr>`;
  }
}

async function loadSettings() {
  const d = await api("/api/super/dashboard/settings");
  const s = d.settings || {};
  const ui = s.package_prices_ui || {};
  document.getElementById("set-name").value = s.admin_name || "";
  document.getElementById("set-email").value = s.admin_email || "";
  // UI Pako 1–4 → çmimet e sakta (jo ID legacy)
  document.getElementById("set-p1").value = ui.pako_1 ?? s.package_prices?.pako_3 ?? "";
  document.getElementById("set-p2").value = ui.pako_2 ?? s.package_prices?.pako_4 ?? "";
  document.getElementById("set-p3").value = ui.pako_3 ?? s.package_prices?.pako_2 ?? "";
  document.getElementById("set-p4").value = ui.pako_4 ?? s.package_prices?.pako_5 ?? "";
  document.getElementById("set-ai").value = s.ai_price_per_1k_tokens ?? "";
}

async function boot() {
  document.getElementById("form-login").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = document.getElementById("login-error");
    err.classList.add("hidden");
    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: document.getElementById("email").value.trim(),
          password: document.getElementById("password").value,
        }),
      });
      if (data.user?.roli !== "super_admin") throw new Error("Vetëm Super Admin.");
      token = data.token;
      localStorage.setItem("rip_token", token);
      currentUser = data.user;
      showApp();
      openSection("pasqyra");
    } catch (ex) {
      err.textContent = ex.message || "Hyrja dështoi";
      err.classList.remove("hidden");
    }
  });

  document.getElementById("btn-logout").addEventListener("click", () => logout(true));
  document.getElementById("btn-hamburger").addEventListener("click", () => document.body.classList.toggle("nav-open"));
  document.getElementById("nav-backdrop").addEventListener("click", closeNav);
  document.getElementById("nav-list").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-section]");
    if (btn) openSection(btn.dataset.section);
  });
  document.getElementById("btn-refresh-clients").addEventListener("click", (e) => {
    e.preventDefault();
    refreshClientsAndProblems(e.currentTarget).catch((ex) => alert(ex.message || ex));
  });
  document.getElementById("problems-kpi")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-prob-jump]");
    if (!btn) return;
    e.preventDefault();
    jumpToProblemCard(btn.dataset.probJump);
  });
  document.getElementById("drawer-close").addEventListener("click", closeDrawer);
  document.getElementById("drawer-backdrop").addEventListener("click", closeDrawer);

  document.getElementById("clients-search")?.addEventListener("input", (e) => {
    renderClientsSectors(e.target.value);
  });

  document.getElementById("btn-gen-key").addEventListener("click", async () => {
    const box = document.getElementById("gen-result");
    const hwEl = document.getElementById("gen-hw");
    const hardwareId = String(hwEl?.value || "").trim();
    if (!hardwareId) {
      box.textContent = "Shkruaj Hardware ID (nga ekrani i klientit).";
      hwEl?.focus();
      return;
    }
    const licenseType =
      String(document.getElementById("gen-license-type")?.value || "annual").toLowerCase() ===
      "trial"
        ? "trial"
        : "annual";
    try {
      let data;
      try {
        data = await api("/api/admin/licenses/generate-hardware-key", {
          method: "POST",
          body: JSON.stringify({ hardwareId, licenseType }),
        });
      } catch {
        data = await api("/api/super/generate-license-key", {
          method: "POST",
          body: JSON.stringify({ hardwareId, licenseType }),
        });
      }
      const key = data.licenseKey || data.celesi || "";
      const hw = data.hardwareId || hardwareId;
      const typeLabel = data.licenseType === "trial" ? "Trial (7 ditë)" : "Vjetor (1 vit)";
      const expLine =
        data.licenseType === "trial"
          ? "7 ditë nga aktivizimi i parë"
          : data.expiresAt
            ? `Skadon: ${data.expiresAt}`
            : "";
      if (hwEl && data.hardwareId) hwEl.value = data.hardwareId;
      box.innerHTML = `
        <div class="copy-row" style="margin-top:0.5rem">
          <div class="mono-box"><div style="color:var(--muted);font-size:0.85rem;margin-bottom:0.25rem">Hardware ID</div>${esc(hw)}</div>
          <button type="button" class="btn btn-ghost btn-copy" data-copy="${esc(hw)}">Kopjo ID</button>
        </div>
        <div class="copy-row" style="margin-top:0.5rem">
          <div class="mono-box"><div style="color:var(--muted);font-size:0.85rem;margin-bottom:0.25rem">Lloji</div>${esc(typeLabel)}${expLine ? `<div style="margin-top:0.25rem;font-size:0.9rem">${esc(expLine)}</div>` : ""}</div>
        </div>
        <div class="copy-row" style="margin-top:0.5rem">
          <div class="mono-box"><div style="color:var(--muted);font-size:0.85rem;margin-bottom:0.25rem">License Key</div>${esc(key)}</div>
          <button type="button" class="btn btn-primary btn-copy" id="btn-copy-gen-key" data-copy="${esc(key)}">Kopjo kodin</button>
        </div>`;
      box.querySelectorAll("[data-copy]").forEach((btn) => {
        btn.addEventListener("click", (ev) => copyText(btn.dataset.copy, ev.currentTarget));
      });
    } catch (ex) {
      box.textContent = ex.message;
    }
  });

  const genHw = document.getElementById("gen-hw");
  if (genHw) {
    genHw.addEventListener("input", () => {
      const hex = String(genHw.value || "").replace(/[^a-fA-F0-9]/g, "").toUpperCase().slice(0, 16);
      let next = hex;
      if (hex.length > 12) next = `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12)}`;
      else if (hex.length > 8) next = `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8)}`;
      else if (hex.length > 4) next = `${hex.slice(0, 4)}-${hex.slice(4)}`;
      if (next !== genHw.value) genHw.value = next;
    });
  }

  document.getElementById("btn-ai-load").addEventListener("click", () => loadAi().catch(alert));
  document.getElementById("btn-inv-create").addEventListener("click", async () => {
    try {
      await api("/api/super/dashboard/billing/invoices", {
        method: "POST",
        body: JSON.stringify({
          restaurant_id: document.getElementById("inv-client").value,
          period_from: document.getElementById("inv-from").value,
          period_to: document.getElementById("inv-to").value,
        }),
      });
      await loadBilling();
      alert("Fatura u krijua.");
    } catch (ex) {
      alert(ex.message);
    }
  });
  document.getElementById("btn-rep-load")?.addEventListener("click", (e) => {
    e.preventDefault();
    refreshClientsAndProblems(e.currentTarget).catch((ex) => alert(ex.message || ex));
  });
  document.getElementById("btn-settings-save").addEventListener("click", async () => {
    try {
      await api("/api/super/dashboard/settings", {
        method: "PUT",
        body: JSON.stringify({
          admin_name: document.getElementById("set-name").value.trim(),
          admin_email: document.getElementById("set-email").value.trim(),
          // Marketing Pako 1–4 (jo ID legacy) — serveri i mapon dhe i ruan në DB
          package_prices_ui: {
            pako_1: Number(document.getElementById("set-p1").value),
            pako_2: Number(document.getElementById("set-p2").value),
            pako_3: Number(document.getElementById("set-p3").value),
            pako_4: Number(document.getElementById("set-p4").value),
          },
          ai_price_per_1k_tokens: Number(document.getElementById("set-ai").value),
        }),
      });
      const msg = document.getElementById("settings-msg");
      msg.textContent = "U ruajt në sistem. Nuk ndryshojnë derisa ti t’i ndryshosh.";
      msg.classList.remove("hidden");
      await loadSettings();
    } catch (ex) {
      alert(ex.message);
    }
  });

  if (!token) {
    showLogin();
    return;
  }
  try {
    const me = await api("/api/auth/me");
    if (me.user?.roli !== "super_admin") throw new Error("jo super");
    currentUser = me.user;
    showApp();
    openSection("pasqyra");
  } catch {
    logout(false);
  }
}

boot();
