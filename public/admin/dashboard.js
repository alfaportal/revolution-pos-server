/* Super Admin desktop dashboard — /admin/dashboard */
let token = localStorage.getItem("rip_token") || "";
let currentUser = null;
let clientsFlat = [];

const TITLES = {
  pasqyra: ["Pasqyra", "Përmbledhje e platformës"],
  klientet: ["Klientët", "Të ndarë sipas kategorisë së biznesit"],
  licencat: ["Licencat", "Hardware ID, çelësa, aktivizim"],
  ai: ["AI Usage", "Tokena, kosto dhe harxhimi me kohë"],
  faturimi: ["Faturimi", "Fatura PDF — paguar / papaguar"],
  raportet: ["Raportet", "Shitjet dhe krahasimi mes klientëve"],
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

async function loadClients() {
  const d = await api("/api/super/dashboard/clients");
  clientsFlat = [];
  const root = document.getElementById("clients-accordions");
  root.innerHTML = (d.groups || [])
    .map((g, idx) => {
      clientsFlat.push(...(g.clients || []));
      const rows = (g.clients || [])
        .map(
          (c) => `<div class="client-row" data-client-id="${esc(c.id)}">
            <div class="client-ico">${esc(c.icon || "🏪")}</div>
            <div class="client-meta">
              <strong>${esc(c.emri)}</strong>
              <span>${esc(c.tipi_label)} · ${esc(c.package_label)} · Sot: ${euro(c.sales_today)}</span>
            </div>
            <span class="badge ${c.status === "aktiv" ? "badge-ok" : "badge-off"}">${esc(c.status)}</span>
          </div>`,
        )
        .join("");
      return `<div class="accordion ${idx === 0 ? "open" : ""}" data-acc="${esc(g.tipi)}">
        <button type="button" class="accordion-head">
          <span>${esc(g.icon || "🏪")} ${esc(g.label)} <span style="color:var(--muted);font-weight:500">(${(g.clients || []).length})</span></span>
          <span class="acc-chevron">▾</span>
        </button>
        <div class="accordion-body">${rows || '<p style="color:var(--muted);padding:0.5rem">Nuk ka klientë</p>'}</div>
      </div>`;
    })
    .join("") || '<p style="color:var(--muted)">Nuk ka klientë.</p>';

  root.querySelectorAll(".accordion-head").forEach((btn) => {
    btn.addEventListener("click", () => btn.parentElement.classList.toggle("open"));
  });
  root.querySelectorAll("[data-client-id]").forEach((row) => {
    row.addEventListener("click", () => openClientDetail(row.dataset.clientId));
  });

  const sel = document.getElementById("inv-client");
  if (sel) {
    sel.innerHTML = clientsFlat
      .map((c) => `<option value="${esc(c.id)}">${esc(c.emri)} (${esc(c.tipi_label)})</option>`)
      .join("");
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
          (l) => `<div style="margin-bottom:0.5rem">
            <span class="badge ${l.statusi === "aktive" ? "badge-ok" : "badge-bad"}">${esc(l.statusi)}</span>
            <div class="mono">HW: ${esc(l.device_id || "—")}</div>
            <div class="mono">Key: ${esc(l.celesi || "—")}</div>
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
}

function closeDrawer() {
  document.getElementById("drawer-root").classList.add("hidden");
}

async function loadLicenses() {
  const d = await api("/api/super/dashboard/licenses");
  const body = document.getElementById("licenses-body");
  body.innerHTML = (d.licenses || [])
    .map((l) => {
      const active = l.statusi === "aktive";
      return `<tr>
        <td>${esc(l.client_name)}</td>
        <td class="mono">${esc(l.hardware_id || "—")}</td>
        <td class="mono">${esc(l.license_key || "—")}</td>
        <td><span class="badge ${active ? "badge-ok" : "badge-bad"}">${esc(l.statusi)}</span></td>
        <td>${esc(fmtDate(l.activated_at))}</td>
        <td style="white-space:nowrap">
          ${
            active
              ? `<button type="button" class="btn btn-danger btn-sm" data-block="${esc(l.id)}">Çaktivizo</button>`
              : `<button type="button" class="btn btn-ok btn-sm" data-unblock="${esc(l.id)}">Riaktivizo</button>`
          }
        </td>
      </tr>`;
    })
    .join("") || `<tr><td colspan="6" style="color:var(--muted)">Nuk ka licenca</td></tr>`;

  body.querySelectorAll("[data-block]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Çaktivizo licencën?")) return;
      await api(`/api/super/dashboard/licenses/${btn.dataset.block}/block`, { method: "POST" });
      loadLicenses();
    });
  });
  body.querySelectorAll("[data-unblock]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await api(`/api/super/dashboard/licenses/${btn.dataset.unblock}/unblock`, { method: "POST" });
      loadLicenses();
    });
  });
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

async function loadReports() {
  const fromEl = document.getElementById("rep-from");
  const toEl = document.getElementById("rep-to");
  if (toEl && !toEl.value) toEl.value = new Date().toISOString().slice(0, 10);
  if (fromEl && !fromEl.value) {
    const f = new Date();
    f.setDate(f.getDate() - 29);
    fromEl.value = f.toISOString().slice(0, 10);
  }
  const params = new URLSearchParams({
    from: fromEl.value,
    to: toEl.value,
    group: document.getElementById("rep-group").value || "day",
  });
  const d = await api(`/api/super/dashboard/reports?${params}`);
  document.getElementById("rep-total").textContent = euro(d.grand_total);
  document.getElementById("rep-orders").textContent = String(d.order_count || 0);
  document.getElementById("rep-clients").textContent = String((d.by_client || []).length);
  document.getElementById("rep-client-body").innerHTML = (d.by_client || [])
    .map((r) => `<tr><td>${esc(r.client_name)}</td><td>${r.orders}</td><td>${euro(r.total)}</td></tr>`)
    .join("") || `<tr><td colspan="3" style="color:var(--muted)">Nuk ka shitje</td></tr>`;
  document.getElementById("rep-period-body").innerHTML = (d.by_period || [])
    .map((r) => `<tr><td>${esc(r.period)}</td><td>${r.orders}</td><td>${euro(r.total)}</td></tr>`)
    .join("") || `<tr><td colspan="3" style="color:var(--muted)">—</td></tr>`;
}

async function loadSettings() {
  const d = await api("/api/super/dashboard/settings");
  const s = d.settings || {};
  document.getElementById("set-name").value = s.admin_name || "";
  document.getElementById("set-email").value = s.admin_email || "";
  document.getElementById("set-p1").value = s.package_prices?.pako_1 ?? "";
  document.getElementById("set-p2").value = s.package_prices?.pako_2 ?? "";
  document.getElementById("set-p3").value = s.package_prices?.pako_3 ?? "";
  document.getElementById("set-p4").value = s.package_prices?.pako_4 ?? "";
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
  document.getElementById("btn-refresh-clients").addEventListener("click", () => loadClients().catch(alert));
  document.getElementById("drawer-close").addEventListener("click", closeDrawer);
  document.getElementById("drawer-backdrop").addEventListener("click", closeDrawer);

  document.getElementById("btn-gen-key").addEventListener("click", async () => {
    try {
      const data = await api("/api/super/generate-license-key", {
        method: "POST",
        body: JSON.stringify({ hardwareId: document.getElementById("gen-hw").value.trim() }),
      });
      document.getElementById("gen-result").textContent = `License Key: ${data.licenseKey}`;
    } catch (ex) {
      document.getElementById("gen-result").textContent = ex.message;
    }
  });

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
  document.getElementById("btn-rep-load").addEventListener("click", () => loadReports().catch(alert));
  document.getElementById("btn-rep-csv").addEventListener("click", async () => {
    const params = new URLSearchParams({
      from: document.getElementById("rep-from").value,
      to: document.getElementById("rep-to").value,
      group: document.getElementById("rep-group").value || "day",
      format: "csv",
    });
    const res = await api(`/api/super/dashboard/reports?${params}`);
    const text = await res.text();
    const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "raport-shitje.csv";
    a.click();
  });
  document.getElementById("btn-settings-save").addEventListener("click", async () => {
    try {
      await api("/api/super/dashboard/settings", {
        method: "PUT",
        body: JSON.stringify({
          admin_name: document.getElementById("set-name").value.trim(),
          admin_email: document.getElementById("set-email").value.trim(),
          package_prices: {
            pako_1: Number(document.getElementById("set-p1").value),
            pako_2: Number(document.getElementById("set-p2").value),
            pako_3: Number(document.getElementById("set-p3").value),
            pako_4: Number(document.getElementById("set-p4").value),
          },
          ai_price_per_1k_tokens: Number(document.getElementById("set-ai").value),
        }),
      });
      const msg = document.getElementById("settings-msg");
      msg.textContent = "U ruajt.";
      msg.classList.remove("hidden");
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
