/* Master Admin desktop dashboard — /admin/dashboard */
let token = localStorage.getItem("rip_token") || "";
let currentUser = null;
let clientsFlat = [];
let sectorsCache = [];
let openSectorIds = new Set();
/** Produkti aktiv: all | kafene | security */
let currentProduct = localStorage.getItem("rip_admin_product") || "all";

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

function productQuery(forClients = false) {
  // Lista klientë/licenca: "all" → kafene (sektoret POS); overview mban "all"
  if (forClients && currentProduct === "all") return "kafene";
  return currentProduct || "all";
}

function setProductTab(product, { reload = true } = {}) {
  currentProduct = product || "all";
  localStorage.setItem("rip_admin_product", currentProduct);
  document.querySelectorAll(".product-tab").forEach((btn) => {
    const on = btn.dataset.product === currentProduct;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });
  const nc = document.getElementById("nc-product");
  if (nc && (currentProduct === "kafene" || currentProduct === "security")) {
    nc.value = currentProduct;
    syncNewClientForm();
  }
  const title = document.getElementById("clients-list-title");
  if (title) {
    title.textContent =
      currentProduct === "security"
        ? "Klientët Security"
        : currentProduct === "kafene"
          ? "Klientët Kafene & Restorante"
          : "Klientët (Kafene — zgjidh Security për tab-in tjetër)";
  }
  if (!reload) return;
  const activeSec = document.querySelector(".section.active");
  const name = activeSec?.id?.replace(/^sec-/, "") || "pasqyra";
  openSection(name);
}

function syncNewClientForm() {
  const product = document.getElementById("nc-product")?.value || "kafene";
  document.querySelectorAll(".nc-kafene-only").forEach((el) => {
    el.classList.toggle("hidden", product === "security");
  });
  document.querySelectorAll(".nc-security-only").forEach((el) => {
    el.classList.toggle("hidden", product !== "security");
  });
}

function showBridgeMsg(text) {
  const el = document.getElementById("product-bridge-msg");
  if (!el) return;
  if (!text) {
    el.classList.add("hidden");
    el.textContent = "";
    return;
  }
  el.textContent = text;
  el.classList.remove("hidden");
}

const TITLES = {
  pasqyra: ["Pasqyra", "Përmbledhje e platformës"],
  klientet: ["Klientët", "9 kategori — gjithmonë të dukshme"],
  licencat: ["Licencat", "ID · Licencë · Ruaj · Kopjo"],
  ai: ["AI Usage", "Tokena, kosto dhe harxhimi me kohë"],
  faturimi: ["Faturimi", "Pagesa bankare + fatura PDF"],
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
  if (name === "faturimi") {
    loadBankPayments().catch((ex) => console.warn(ex));
    loadBilling();
  }
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
  const d = await api(`/api/super/dashboard/overview?product=${encodeURIComponent(currentProduct || "all")}`);
  document.getElementById("kpi-active").textContent = String(d.active_clients ?? 0);
  const kpiLic = document.getElementById("kpi-licenses");
  if (kpiLic) kpiLic.textContent = String(d.licenses_active ?? d.licenses_total ?? 0);
  const kpiTrial = document.getElementById("kpi-trial");
  if (kpiTrial) kpiTrial.textContent = String(d.trial_accounts ?? 0);
  document.getElementById("kpi-sales").textContent = euro(d.sales_today_total);
  document.getElementById("kpi-problems").textContent = String((d.problem_clients || []).length);
  showBridgeMsg(d.bridge_error || d.by_product?.security?.bridge_error || "");
  renderChart(document.getElementById("chart-weekly"), d.weekly_sales || [], "total");
  const list = document.getElementById("problem-list");
  const problems = d.problem_clients || [];
  list.innerHTML = problems.length
    ? problems
        .map(
          (p) => `<li>
            <div><strong>${esc(p.emri)}</strong><div style="color:var(--muted);font-size:0.8rem">${esc(p.tipi_label || "")}${p.product_line ? ` · ${esc(p.product_line)}` : ""}</div></div>
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
  // Security: sektori nga API; Kafene: GJITHMONË 9
  const sectors =
    currentProduct === "security"
      ? sectorsCache.length
        ? sectorsCache
        : [{ num: 1, id: "security", label: "Klientë Security", keywords: ["security"], clients: [] }]
      : ensureNineSectors(sectorsCache);

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
    const all =
      currentProduct === "security"
        ? (sectorsCache || []).flatMap((s) => s.clients || [])
        : ensureNineSectors(sectorsCache).flatMap((s) => s.clients || []);
    sel.innerHTML = all
      .map((c) => `<option value="${esc(c.id)}">${esc(c.emri)} (${esc(c.tipi_label)})</option>`)
      .join("");
  }
}

async function loadClients() {
  try {
    const product = productQuery(true);
    const d = await api(`/api/super/dashboard/clients?product=${encodeURIComponent(product)}`);
    showBridgeMsg(d.bridge_error || "");
    if (product === "security") {
      sectorsCache = d.sectors || d.groups || [];
    } else {
      sectorsCache = ensureNineSectors(d.sectors || d.groups || []);
    }
  } catch (e) {
    showBridgeMsg(e.message || "Gabim gjatë ngarkimit të klientëve");
    sectorsCache = currentProduct === "security" ? [] : ensureNineSectors([]);
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
  if (currentProduct === "security" || productQuery(true) === "security") {
    const hit = (sectorsCache || []).flatMap((s) => s.clients || []).find((c) => String(c.id) === String(id));
    document.getElementById("drawer-root").classList.remove("hidden");
    document.getElementById("drawer-title").textContent = `🛡️ ${hit?.emri || "Klient Security"}`;
    document.getElementById("drawer-sub").textContent = `${hit?.tipi_label || hit?.veprimtari || "Security"} · ${hit?.email || ""}`;
    document.getElementById("drawer-body").innerHTML = `
      <div class="detail-block">
        <h4>Revolution Security</h4>
        <div>Email: <strong>${esc(hit?.email || "—")}</strong></div>
        <div>Telefon: <strong>${esc(hit?.telefoni || "—")}</strong></div>
        <div>Veprimtari: <strong>${esc(hit?.veprimtari || hit?.tipi_label || "—")}</strong></div>
        <p style="color:var(--muted);font-size:0.9rem;margin:0.75rem 0 0">
          Licencat menaxhohen te skeda <strong>Licencat</strong> me filtrin Security.
        </p>
      </div>`;
    return;
  }
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
            <div class="mono">ID: ${esc(l.hardware_id || "—")}</div>
            <div class="mono">Key: ${esc(l.celesi || "—")}</div>
            <div style="color:var(--muted);font-size:0.85rem;margin:0.2rem 0">Skadon: ${esc(l.data_skadimit || "—")}</div>
            <div class="prob-actions" style="margin-top:0.4rem;display:flex;flex-wrap:wrap;gap:0.35rem">
              <button type="button" class="btn btn-ghost btn-sm" data-drawer-extend="${esc(l.id)}" data-months="1">+1 muaj</button>
              <button type="button" class="btn btn-ghost btn-sm" data-drawer-extend="${esc(l.id)}" data-months="3">+3 muaj</button>
              <button type="button" class="btn btn-primary btn-sm" data-drawer-extend="${esc(l.id)}" data-months="12">+12 muaj</button>
              ${
                ["pezulluar", "revokuar"].includes(String(l.statusi || ""))
                  ? `<button type="button" class="btn btn-ok btn-sm" data-drawer-reactivate="${esc(l.id)}" data-hw="${esc(l.hardware_id || "")}">Riaktivizo</button>`
                  : `<button type="button" class="btn btn-danger btn-sm" data-drawer-revoke="${esc(l.id)}" data-hw="${esc(l.hardware_id || "")}">Çaktivizo Menjëherë</button>`
              }
              <button type="button" class="btn btn-ghost btn-sm" style="border-color:#b45309;color:#b45309" data-drawer-wipe="${esc(l.id)}" data-hw="${esc(l.hardware_id || "")}">Fshi të Dhënat</button>
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
  root.querySelectorAll("[data-drawer-revoke]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const reason = prompt("Çaktivizo menjëherë? Arsyeja (opsionale):", "");
      if (reason === null) return;
      btn.disabled = true;
      try {
        await api(`/api/super/dashboard/licenses/${btn.dataset.drawerRevoke}/revoke`, {
          method: "POST",
          body: JSON.stringify({
            hardware_id: btn.dataset.hw || undefined,
            reason: String(reason || "").trim(),
          }),
        });
        await refreshClientsAndProblems();
        if (clientId) await openClientDetail(clientId);
      } catch (ex) {
        alert(ex.message || "Çaktivizimi dështoi.");
      } finally {
        btn.disabled = false;
      }
    });
  });
  root.querySelectorAll("[data-drawer-reactivate]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Riaktivizo licencën?")) return;
      btn.disabled = true;
      try {
        await api(`/api/super/dashboard/licenses/${btn.dataset.drawerReactivate}/reactivate`, {
          method: "POST",
          body: JSON.stringify({ hardware_id: btn.dataset.hw || undefined }),
        });
        await refreshClientsAndProblems();
        if (clientId) await openClientDetail(clientId);
      } catch (ex) {
        alert(ex.message || "Riaktivizimi dështoi.");
      } finally {
        btn.disabled = false;
      }
    });
  });
  root.querySelectorAll("[data-drawer-wipe]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Fshi të dhënat lokale te POS? (Cloud nuk fshihet)")) return;
      const typed = prompt('Shkruani FSHI TE DHENAT për të konfirmuar:', "");
      if (typed === null) return;
      if (String(typed).trim().toUpperCase().replace(/\s+/g, " ") !== "FSHI TE DHENAT") {
        alert("Konfirmimi nuk përputhet.");
        return;
      }
      btn.disabled = true;
      try {
        await api(`/api/super/dashboard/licenses/${btn.dataset.drawerWipe}/wipe-data`, {
          method: "POST",
          body: JSON.stringify({
            confirm: "FSHI TE DHENAT",
            hardware_id: btn.dataset.hw || undefined,
          }),
        });
        alert("Urdhri i fshirjes u dërgua te POS.");
        await refreshClientsAndProblems();
        if (clientId) await openClientDetail(clientId);
      } catch (ex) {
        alert(ex.message || "Fshirja dështoi.");
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
  root.querySelectorAll("[data-copy-text]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      copyText(btn.dataset.copyText || "", btn);
    });
  });
  root.querySelectorAll("[data-sec-status]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const status = btn.dataset.status;
      const label = status === "active" ? "riaktivizosh" : status === "suspended" ? "pezullosh" : "revokosh";
      if (!confirm(`A doni të ${label} këtë licencë Security?`)) return;
      btn.disabled = true;
      try {
        await api(`/api/super/dashboard/security/licenses/${btn.dataset.secStatus}/status`, {
          method: "POST",
          body: JSON.stringify({ status }),
        });
        await loadLicenses();
      } catch (ex) {
        alert(ex.message || "Ndryshimi i statusit dështoi.");
      } finally {
        btn.disabled = false;
      }
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
  root.querySelectorAll("[data-revoke]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const reason = prompt(
        "Çaktivizo menjëherë këtë licencë / Hardware ID?\nPOS mbyllet brenda ~15 sekondash.\nArsyeja (opsionale):",
        "",
      );
      if (reason === null) return;
      btn.disabled = true;
      try {
        await api(`/api/super/dashboard/licenses/${btn.dataset.revoke}/revoke`, {
          method: "POST",
          body: JSON.stringify({
            hardware_id: btn.dataset.hw || undefined,
            reason: String(reason || "").trim(),
          }),
        });
        alert("Licenca u çaktivizua. POS do të mbyllet në heartbeat-in e radhës.");
        loadLicenses();
      } catch (ex) {
        alert(ex.message || "Çaktivizimi dështoi.");
      } finally {
        btn.disabled = false;
      }
    });
  });
  root.querySelectorAll("[data-reactivate]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Riaktivizo licencën? Klienti mund të hapë POS përsëri.")) return;
      btn.disabled = true;
      try {
        await api(`/api/super/dashboard/licenses/${btn.dataset.reactivate}/reactivate`, {
          method: "POST",
          body: JSON.stringify({
            hardware_id: btn.dataset.hw || undefined,
          }),
        });
        alert("Licenca u riaktivizua.");
        loadLicenses();
      } catch (ex) {
        alert(ex.message || "Riaktivizimi dështoi.");
      } finally {
        btn.disabled = false;
      }
    });
  });
  root.querySelectorAll("[data-wipe]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (
        !confirm(
          "Fshi të dhënat LOKALE te POS (SQLite / rivendos si të re)?\n\nKjo NUK çaktivizon licencën.\nCloud NUK fshihet.\n\nVazhdo?",
        )
      ) {
        return;
      }
      const typed = prompt('Shkruani FSHI TE DHENAT për të konfirmuar:', "");
      if (typed === null) return;
      if (String(typed).trim().toUpperCase().replace(/\s+/g, " ") !== "FSHI TE DHENAT") {
        alert("Konfirmimi nuk përputhet. Asgjë nuk u ndryshua.");
        return;
      }
      const reason = prompt("Arsyeja (opsionale):", "") || "";
      btn.disabled = true;
      try {
        await api(`/api/super/dashboard/licenses/${btn.dataset.wipe}/wipe-data`, {
          method: "POST",
          body: JSON.stringify({
            confirm: "FSHI TE DHENAT",
            hardware_id: btn.dataset.hw || undefined,
            reason: String(reason).trim(),
          }),
        });
        alert("Urdhri u dërgua. POS do të rivendosë të dhënat lokale në heartbeat-in e radhës.");
        loadLicenses();
      } catch (ex) {
        alert(ex.message || "Fshirja dështoi.");
      } finally {
        btn.disabled = false;
      }
    });
  });
  root.querySelectorAll("[data-gen-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.genId;
      const hwEl = root.querySelector(`[data-hw-input="${id}"]`);
      const msgEl =
        btn.closest("[data-license-card]")?.querySelector(`[data-save-msg="${id}"]`) ||
        root.querySelector(`[data-save-msg="${id}"]`);
      const bytes = new Uint8Array(8);
      crypto.getRandomValues(bytes);
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
      const hw =
        `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
      if (hwEl) hwEl.value = hw;
      if (msgEl) {
        msgEl.classList.remove("err");
        msgEl.textContent = `ID: ${hw}`;
      }
    });
  });
  root.querySelectorAll("[data-copy-pair]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.copyPair;
      const hwEl = root.querySelector(`[data-hw-input="${id}"]`);
      const keyEl = root.querySelector(`[data-key-input="${id}"]`);
      const hw = String(hwEl?.value || "").trim();
      const key = String(keyEl?.value || "").trim();
      const text = key && hw ? `ID: ${hw}\nLicenca: ${key}` : key || hw;
      if (!text) {
        alert("Nuk ka ID as licencë.");
        return;
      }
      copyText(text, btn);
    });
  });
  root.querySelectorAll("[data-gen-from-hw]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.genFromHw;
      const hwEl = root.querySelector(`[data-hw-input="${id}"]`);
      const keyEl = root.querySelector(`[data-key-input="${id}"]`);
      const msgEl =
        btn.closest("[data-license-card]")?.querySelector(`[data-save-msg="${id}"]`) ||
        root.querySelector(`[data-save-msg="${id}"]`);
      const hardwareId = String(hwEl?.value || "").trim();
      const hwHex = hardwareId.replace(/[^a-fA-F0-9]/g, "").toUpperCase();
      if (!hardwareId || hwHex.length !== 16) {
        const msg =
          "Ngjit ID e pajisjes nga ekrani «Aktivizo» te POS (16 shenja: XXXX-XXXX-XXXX-XXXX). Pastaj shtyp përsëri Gjenero.";
        if (msgEl) {
          msgEl.classList.add("err");
          msgEl.textContent = msg;
        } else {
          alert(msg);
        }
        hwEl?.focus();
        return;
      }
      btn.disabled = true;
      const prev = btn.textContent;
      btn.textContent = "Duke gjeneruar…";
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
        const hwOut = data.hardwareId || hardwareId;
        if (hwEl) hwEl.value = hwOut;
        if (keyEl) {
          keyEl.value = key;
          keyEl.readOnly = false;
          keyEl.focus();
          keyEl.select();
        }
        if (msgEl) {
          msgEl.classList.remove("err");
          msgEl.textContent = `Licenca u gjenerua — shtyp Ruaj`;
        }
        btn.textContent = "U gjenerua ✓";
        setTimeout(() => {
          btn.textContent = prev;
          btn.disabled = false;
        }, 1200);
      } catch (ex) {
        btn.textContent = prev;
        btn.disabled = false;
        const err = ex.message || "Gjenerimi dështoi.";
        if (msgEl) {
          msgEl.classList.add("err");
          msgEl.textContent = err;
        } else {
          alert(err);
        }
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
      const hwRaw = String(hwEl?.value || "").trim();
      const celesi = String(keyEl?.value || "").trim();
      const hwHex = hwRaw.replace(/[^a-fA-F0-9]/g, "").toUpperCase();
      if (!celesi) {
        if (msgEl) {
          msgEl.textContent = "Shkruaj ose gjenero kodin e licencës.";
          msgEl.classList.add("err");
        } else {
          alert("Shkruaj ose gjenero kodin e licencës.");
        }
        keyEl?.focus();
        return;
      }
      if (hwRaw && hwHex.length !== 16) {
        const msg = "ID e pajisjes duhet 16 shenja (XXXX-XXXX-XXXX-XXXX) nga POS Aktivizo.";
        if (msgEl) {
          msgEl.textContent = msg;
          msgEl.classList.add("err");
        } else {
          alert(msg);
        }
        hwEl?.focus();
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
        const patch = { celesi };
        if (hwHex.length === 16) {
          try {
            await api(`/api/admin/licenses/${id}`, {
              method: "PATCH",
              body: JSON.stringify({ celesi, hardware_id: hwRaw }),
            });
          } catch {
            await api(`/api/admin/licenses/${id}`, {
              method: "PATCH",
              body: JSON.stringify(patch),
            });
          }
        } else {
          await api(`/api/admin/licenses/${id}`, {
            method: "PATCH",
            body: JSON.stringify(patch),
          });
        }
        btn.textContent = "U ruajt ✓";
        if (msgEl) {
          msgEl.classList.remove("err");
          msgEl.textContent = "U ruajt — i njëjti ID/licencë te telefon + panel.";
        }
        setTimeout(() => {
          btn.textContent = prev;
          btn.disabled = false;
          loadLicenses().catch(() => {});
        }, 800);
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

function formatLicenseHwId(raw) {
  const hex = String(raw || "")
    .replace(/[^a-fA-F0-9]/g, "")
    .toUpperCase();
  if (hex.length !== 16) return "";
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}

async function loadLicenses() {
  const product = productQuery(true);
  let list = [];
  if (product === "security") {
    const d = await api(`/api/super/dashboard/licenses?product=security`);
    showBridgeMsg(d.bridge_error || "");
    list = (d.licenses || []).map((l) => ({
      id: l.id,
      client_name: l.client_name || "—",
      hardware_id: formatLicenseHwId(l.hardware_id) || l.hardware_id || "",
      license_key: l.license_key || "",
      statusi: l.statusi,
      activation_email: "",
      source: "securetrack",
    }));
  } else {
    /* I njëjti API si telefoni — ID + çelësi të njëjtë pas Ruaj / Rifresko */
    const d = await api("/api/admin/licenses");
    showBridgeMsg("");
    list = (d.licenses || []).map((l) => {
      const hw =
        formatLicenseHwId(l.hardware_id) ||
        formatLicenseHwId(l.display_device_id) ||
        formatLicenseHwId(l.device_id) ||
        "";
      return {
        id: l.id,
        client_name: l.clients?.emri || "—",
        hardware_id: hw,
        license_key: l.celesi || "",
        statusi: l.statusi,
        activation_email: l.activation_email || "",
        source: "pos",
      };
    });
  }

  const isSecurity = product === "security";
  const cards = document.getElementById("licenses-cards");
  if (cards) {
    cards.innerHTML = list.length
      ? list
          .map((l) => {
            const active = l.statusi === "aktive";
            const hw = l.hardware_id || "";
            const key = l.license_key || "";
            if (isSecurity) {
              return `<div class="license-card" data-license-card="${esc(l.id)}">
                <h4>${esc(l.client_name)}
                  <span class="badge ${active ? "badge-ok" : "badge-bad"}" style="margin-left:0.35rem">${esc(l.statusi)}</span>
                </h4>
                <div class="lic-field-block">
                  <label class="lic-field-label">Licenca</label>
                  <div class="mono" style="word-break:break-all">${esc(key || "—")}</div>
                </div>
                <div class="lic-card-actions" style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem">
                  <button type="button" class="btn btn-ghost" data-copy-text="${esc(key)}">Kopjo</button>
                  ${
                    active
                      ? `<button type="button" class="btn btn-danger btn-sm" data-sec-status="${esc(l.id)}" data-status="revoked">Revoko</button>
                         <button type="button" class="btn btn-ghost btn-sm" data-sec-status="${esc(l.id)}" data-status="suspended">Pezullo</button>`
                      : `<button type="button" class="btn btn-ok btn-sm" data-sec-status="${esc(l.id)}" data-status="active">Riaktivizo</button>`
                  }
                </div>
              </div>`;
            }
            return `<div class="license-card" data-license-card="${esc(l.id)}">
              <h4>${esc(l.client_name)}
                <span class="badge ${active ? "badge-ok" : "badge-bad"}" style="margin-left:0.35rem">${esc(l.statusi)}</span>
              </h4>
              <div class="lic-field-block">
                <label class="lic-field-label">ID</label>
                <input type="text" class="lic-edit-input mono" data-hw-input="${esc(l.id)}" value="${esc(hw)}" placeholder="XXXX-XXXX-XXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false" inputmode="text">
              </div>
              <div class="lic-field-block">
                <label class="lic-field-label">Licenca</label>
                <input type="text" class="lic-edit-input mono" data-key-input="${esc(l.id)}" value="${esc(key)}" placeholder="—" autocomplete="off">
              </div>
              ${
                l.activation_email
                  ? `<div class="lic-field-block"><label class="lic-field-label">Email aktivizimi</label><div class="mono" style="font-size:0.9rem">${esc(l.activation_email)}</div></div>`
                  : ""
              }
              <p class="lic-save-msg" data-save-msg="${esc(l.id)}"></p>
              <div class="lic-card-actions" style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem">
                <button type="button" class="btn btn-ok" data-gen-id="${esc(l.id)}">Gjenero ID</button>
                <button type="button" class="btn btn-primary" data-gen-from-hw="${esc(l.id)}">Gjenero Licencë</button>
                <button type="button" class="btn btn-accent" data-save-license="${esc(l.id)}">Ruaj</button>
                <button type="button" class="btn btn-ghost" data-copy-pair="${esc(l.id)}">Kopjo</button>
              </div>
              <div class="lic-card-actions" style="display:grid;grid-template-columns:1fr;gap:0.4rem;margin-top:0.55rem">
                ${
                  ["revokuar", "pezulluar"].includes(String(l.statusi || ""))
                    ? `<button type="button" class="btn btn-ok btn-sm" data-reactivate="${esc(l.id)}" data-hw="${esc(hw)}">Riaktivizo</button>`
                    : `<button type="button" class="btn btn-danger btn-sm" data-revoke="${esc(l.id)}" data-hw="${esc(hw)}">Çaktivizo Menjëherë</button>`
                }
                <button type="button" class="btn btn-ghost btn-sm" style="border-color:#b45309;color:#b45309" data-wipe="${esc(l.id)}" data-hw="${esc(hw)}">Fshi të Dhënat</button>
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
        const hw = l.hardware_id || "";
        const key = l.license_key || "";
        if (isSecurity) {
          return `<tr>
            <td>${esc(l.client_name)}</td>
            <td class="mono">${esc(hw || "—")}</td>
            <td class="mono">${esc(key || "—")}</td>
            <td><span class="badge ${active ? "badge-ok" : "badge-bad"}">${esc(l.statusi)}</span></td>
            <td style="white-space:nowrap">
              <button type="button" class="btn btn-ghost btn-sm" data-copy-text="${esc(key)}">Kopjo</button>
              ${
                active
                  ? `<button type="button" class="btn btn-danger btn-sm" data-sec-status="${esc(l.id)}" data-status="revoked">Revoko</button>
                     <button type="button" class="btn btn-ghost btn-sm" data-sec-status="${esc(l.id)}" data-status="suspended">Pezullo</button>`
                  : `<button type="button" class="btn btn-ok btn-sm" data-sec-status="${esc(l.id)}" data-status="active">Riaktivizo</button>`
              }
            </td>
          </tr>`;
        }
        return `<tr>
          <td>${esc(l.client_name)}</td>
          <td>
            <input type="text" class="lic-edit-input mono" data-hw-input="${esc(l.id)}" value="${esc(hw)}" placeholder="XXXX-XXXX-XXXX-XXXX" autocomplete="off" spellcheck="false">
          </td>
          <td>
            <input type="text" class="lic-edit-input mono" data-key-input="${esc(l.id)}" value="${esc(key)}" placeholder="—" autocomplete="off" spellcheck="false">
          </td>
          <td><span class="badge ${active ? "badge-ok" : "badge-bad"}">${esc(l.statusi)}</span></td>
          <td style="white-space:nowrap">
            <button type="button" class="btn btn-ok btn-sm" data-gen-id="${esc(l.id)}">Gjenero ID</button>
            <button type="button" class="btn btn-primary btn-sm" data-gen-from-hw="${esc(l.id)}">Gjenero Licencë</button>
            <button type="button" class="btn btn-accent btn-sm" data-save-license="${esc(l.id)}">Ruaj</button>
            <button type="button" class="btn btn-ghost btn-sm" data-copy-pair="${esc(l.id)}">Kopjo</button>
            ${
              ["revokuar", "pezulluar"].includes(String(l.statusi || ""))
                ? `<button type="button" class="btn btn-ok btn-sm" data-reactivate="${esc(l.id)}" data-hw="${esc(hw)}">Riaktivizo</button>`
                : `<button type="button" class="btn btn-danger btn-sm" data-revoke="${esc(l.id)}" data-hw="${esc(hw)}">Çaktivizo Menjëherë</button>`
            }
            <button type="button" class="btn btn-ghost btn-sm" style="border-color:#b45309;color:#b45309" data-wipe="${esc(l.id)}" data-hw="${esc(hw)}">Fshi të Dhënat</button>
            <p class="lic-save-msg" data-save-msg="${esc(l.id)}"></p>
          </td>
        </tr>`;
      })
      .join("") || `<tr><td colspan="5" style="color:var(--muted)">Nuk ka licenca</td></tr>`;
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

function bindBankConfirmButtons(root) {
  (root || document).querySelectorAll("[data-bank-confirm]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const token = btn.dataset.bankConfirm;
      if (
        !confirm(
          "A ka ardhur pagesa në bankë?\n\nVetëm nëse PO — lëshohet fatura PDF (vulë/datë) me email dhe çelësi i licencës.",
        )
      ) {
        return;
      }
      btn.disabled = true;
      const prev = btn.textContent;
      btn.textContent = "Duke dërguar…";
      try {
        const r = await api(`/api/admin/bank-payments/${encodeURIComponent(token)}/confirm`, {
          method: "POST",
          body: JSON.stringify({}),
        });
        alert(
          r.already
            ? `Tashmë e dërguar: ${r.invoice_number || ""}`
            : `Fatura u dërgua: ${r.invoice_number || ""}\nEmail: ${r.email || ""}\nÇelësi: ${r.celesi || "—"}`,
        );
        loadBankPayments();
      } catch (ex) {
        alert(ex.message || ex);
        btn.disabled = false;
        btn.textContent = prev;
      }
    });
  });
}

async function loadBankPayments() {
  const body = document.getElementById("bank-pay-body");
  const cards = document.getElementById("bank-pay-cards");
  const d = await api("/api/admin/bank-payments");
  const rows = d.payments || [];

  const statusMeta = (p) => {
    const pending = p.status === "pending";
    const issued = p.invoice_issued;
    return {
      pending,
      issued,
      statusLabel: issued ? "Fatura dërguar" : pending ? "Në pritje të pagesës" : esc(p.status),
      badge: issued ? "badge-ok" : pending ? "badge-warn" : "badge-ok",
      action: pending
        ? `<button type="button" class="btn btn-ok bank-confirm-btn" data-bank-confirm="${esc(p.token)}">Konfirmo pagesën &amp; dërgo faturë PDF</button>`
        : issued
          ? `<span class="mono" style="font-size:0.85rem">${esc(p.invoice_number || "OK")}</span>`
          : "—",
    };
  };

  if (cards) {
    cards.innerHTML =
      rows
        .map((p) => {
          const m = statusMeta(p);
          return `<article class="bank-pay-card">
            <div class="bank-pay-card-top">
              <strong>${esc(p.business_name || "—")}</strong>
              <span class="badge ${m.badge}">${m.statusLabel}</span>
            </div>
            <div class="bank-pay-card-meta">${esc(p.owner_name || "")} · ${esc(fmtDate(p.created_at))}</div>
            <div class="bank-pay-card-row"><span>Pako</span><strong>${esc(p.plan_label || p.plan)}</strong></div>
            <div class="bank-pay-card-row"><span>Shuma</span><strong>${euro(p.amount_eur)}</strong></div>
            <div class="bank-pay-card-row"><span>Email</span><strong class="mono">${esc(p.email)}</strong></div>
            ${p.phone ? `<div class="bank-pay-card-row"><span>Tel</span><a href="tel:${esc(p.phone)}">${esc(p.phone)}</a></div>` : ""}
            <div class="bank-pay-card-actions">${m.action}</div>
          </article>`;
        })
        .join("") ||
      `<p class="bank-pay-empty">Nuk ka kërkesa bankare ende</p>`;
    bindBankConfirmButtons(cards);
  }

  if (body) {
    body.innerHTML =
      rows
        .map((p) => {
          const m = statusMeta(p);
          return `<tr>
        <td>${esc(fmtDate(p.created_at))}</td>
        <td>${esc(p.business_name)}<div style="font-size:0.8rem;color:var(--muted)">${esc(p.owner_name)}</div></td>
        <td>${esc(p.plan_label || p.plan)}</td>
        <td>${euro(p.amount_eur)}</td>
        <td class="mono" style="font-size:0.85rem">${esc(p.email)}</td>
        <td><span class="badge ${m.badge}">${m.statusLabel}</span></td>
        <td style="white-space:nowrap">${m.action}</td>
      </tr>`;
        })
        .join("") ||
      `<tr><td colspan="7" style="color:var(--muted)">Nuk ka kërkesa bankare ende</td></tr>`;
    bindBankConfirmButtons(body);
  }
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
  document.querySelectorAll(".product-tab").forEach((btn) => {
    btn.addEventListener("click", () => setProductTab(btn.dataset.product));
  });
  document.querySelectorAll(".product-tab").forEach((btn) => {
    const on = btn.dataset.product === currentProduct;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });
  document.getElementById("nc-product")?.addEventListener("change", syncNewClientForm);
  syncNewClientForm();

  function bindNcHex16(el) {
    if (!el || el.dataset.fmtBound === "1") return;
    el.dataset.fmtBound = "1";
    el.addEventListener("input", () => {
      const hex = String(el.value || "")
        .replace(/[^a-fA-F0-9]/g, "")
        .toUpperCase()
        .slice(0, 16);
      let next = hex;
      if (hex.length > 12) next = `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12)}`;
      else if (hex.length > 8) next = `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8)}`;
      else if (hex.length > 4) next = `${hex.slice(0, 4)}-${hex.slice(4)}`;
      if (next !== el.value) el.value = next;
    });
  }
  bindNcHex16(document.getElementById("nc-hw-id"));
  bindNcHex16(document.getElementById("nc-license-key"));

  document.getElementById("btn-nc-gen-id")?.addEventListener("click", () => {
    const hwEl = document.getElementById("nc-hw-id");
    const msg = document.getElementById("nc-msg");
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    const hw = `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
    if (hwEl) hwEl.value = hw;
    if (msg) msg.textContent = `ID: ${hw}`;
  });

  document.getElementById("btn-nc-gen-key")?.addEventListener("click", async () => {
    const hwEl = document.getElementById("nc-hw-id");
    const keyEl = document.getElementById("nc-license-key");
    const msg = document.getElementById("nc-msg");
    const btn = document.getElementById("btn-nc-gen-key");
    const hardwareId = String(hwEl?.value || "").trim();
    const hwHex = hardwareId.replace(/[^a-fA-F0-9]/g, "").toUpperCase();
    if (!hardwareId || hwHex.length !== 16) {
      const t = "ID duhet 16 shenja (XXXX-XXXX-XXXX-XXXX). Gjenero ID ose ngjit nga POS.";
      if (msg) msg.textContent = t;
      else alert(t);
      hwEl?.focus();
      return;
    }
    const licenseType =
      String(document.getElementById("nc-license-type")?.value || "annual").toLowerCase() === "trial"
        ? "trial"
        : "annual";
    if (btn) btn.disabled = true;
    if (msg) msg.textContent = "Duke gjeneruar licencën…";
    try {
      let data;
      try {
        data = await api("/api/super/generate-license-key", {
          method: "POST",
          body: JSON.stringify({ hardwareId, licenseType }),
        });
      } catch {
        data = await api("/api/admin/licenses/generate-hardware-key", {
          method: "POST",
          body: JSON.stringify({ hardwareId, licenseType }),
        });
      }
      const key = data.licenseKey || data.celesi || "";
      if (hwEl) hwEl.value = data.hardwareId || formatLicenseHwId(hardwareId) || hardwareId;
      if (keyEl) keyEl.value = key;
      document.getElementById("nc-license").checked = true;
      if (msg) msg.textContent = key ? `Licenca u gjenerua: ${key}` : "Licenca u gjenerua.";
    } catch (ex) {
      if (msg) msg.textContent = ex.message || "Gjenerimi dështoi";
      else alert(ex.message || "Gjenerimi dështoi");
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  document.getElementById("btn-nc-copy-pair")?.addEventListener("click", (e) => {
    const hw = String(document.getElementById("nc-hw-id")?.value || "").trim();
    const key = String(document.getElementById("nc-license-key")?.value || "").trim();
    const text = key && hw ? `ID: ${hw}\nLicenca: ${key}` : key || hw;
    if (!text) {
      alert("Nuk ka ID as licencë.");
      return;
    }
    copyText(text, e.currentTarget);
  });

  document.getElementById("form-new-client")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("nc-msg");
    const btn = document.getElementById("btn-nc-submit");
    const product = document.getElementById("nc-product")?.value || "kafene";
    const hardwareId = String(document.getElementById("nc-hw-id")?.value || "").trim();
    const licenseKey = String(document.getElementById("nc-license-key")?.value || "").trim();
    const issueLicense = Boolean(document.getElementById("nc-license")?.checked);
    const licenseType =
      String(document.getElementById("nc-license-type")?.value || "annual").toLowerCase() === "trial"
        ? "trial"
        : "annual";
    const hwHex = hardwareId.replace(/[^a-fA-F0-9]/g, "").toUpperCase();
    const keyHex = licenseKey.replace(/[^a-fA-F0-9]/g, "").toUpperCase();

    if (issueLicense && hardwareId && hwHex.length !== 16) {
      if (msg) msg.textContent = "ID e pajisjes duhet 16 shenja (XXXX-XXXX-XXXX-XXXX).";
      return;
    }
    if (issueLicense && licenseKey && keyHex.length !== 16) {
      if (msg) msg.textContent = "Çelësi i licencës duhet 16 shenja (XXXX-XXXX-XXXX-XXXX).";
      return;
    }

    const body = {
      product_line: product,
      emri: document.getElementById("nc-emri")?.value?.trim(),
      email: document.getElementById("nc-email")?.value?.trim(),
      telefoni: document.getElementById("nc-tel")?.value?.trim(),
      telefon: document.getElementById("nc-tel")?.value?.trim(),
      tipi: document.getElementById("nc-tipi")?.value,
      package_tier: document.getElementById("nc-pako")?.value,
      veprimtari: document.getElementById("nc-veprimtari")?.value,
      issue_license: issueLicense,
      license_type: licenseType,
      hardware_id: hardwareId || undefined,
      celesi: licenseKey || undefined,
      license_key: licenseKey || undefined,
    };
    if (!body.emri) {
      if (msg) msg.textContent = "Emri është i detyrueshëm.";
      return;
    }
    if (btn) btn.disabled = true;
    if (msg) msg.textContent = "Duke regjistruar klientin + licencën…";
    try {
      const data = await api("/api/super/dashboard/clients", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const licKey = data.license?.celesi || data.license?.license_key || licenseKey || "";
      const hwOut = data.hardware_id || hardwareId || "";
      if (msg) {
        msg.textContent = licKey
          ? `U krijua. ID: ${hwOut || "—"} · Licenca: ${licKey}`
          : "Klienti u krijua.";
      }
      if (licKey && document.getElementById("nc-license-key")) {
        document.getElementById("nc-license-key").value = licKey;
      }
      if (hwOut && document.getElementById("nc-hw-id")) {
        document.getElementById("nc-hw-id").value = hwOut;
      }
      document.getElementById("nc-emri").value = "";
      if (product === "security" || currentProduct === "security") {
        setProductTab("security");
      } else {
        await loadClients();
      }
      await loadLicenses().catch(() => null);
    } catch (ex) {
      if (msg) msg.textContent = ex.message || "Gabim";
      else alert(ex.message || "Gabim");
    } finally {
      if (btn) btn.disabled = false;
    }
  });

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

  document.getElementById("btn-setup-link")?.addEventListener("click", async () => {
    const box = document.getElementById("setup-link-result");
    if (!box) return;
    box.textContent = "Duke gjeneruar…";
    try {
      const ttl = Number(document.getElementById("setup-ttl")?.value || 168);
      const data = await api(`/api/admin/setup-download-link?ttlHours=${encodeURIComponent(ttl)}`);
      const url = data.url || "";
      box.innerHTML = `
        <div class="copy-row">
          <div class="mono-box"><div style="color:var(--muted);font-size:0.85rem;margin-bottom:0.25rem">Setup v${esc(data.setup_version || "")} — skadon ${esc(String(data.expires_in_hours || ttl))}h</div>${esc(url)}</div>
          <button type="button" class="btn btn-ghost btn-copy" data-copy="${esc(url)}">Kopjo link</button>
        </div>`;
      box.querySelector("[data-copy]")?.addEventListener("click", (e) => {
        copyText(url, e.currentTarget).catch(() => {});
      });
    } catch (ex) {
      box.textContent = ex.message || String(ex);
    }
  });

  document.getElementById("btn-ai-load").addEventListener("click", () => loadAi().catch(alert));
  document.getElementById("btn-bank-pay-refresh")?.addEventListener("click", () => {
    loadBankPayments().catch((ex) => alert(ex.message || ex));
  });
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
