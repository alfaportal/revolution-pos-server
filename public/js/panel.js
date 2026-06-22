let token = localStorage.getItem("rip_token") || "";

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
  const warn = problems.length
    ? `<span class="license-warn" title="${esc(problems.join(" — "))}" aria-label="Problem">⚠️</span> `
    : "";
  return `${warn}${badge(l.statusi)}`;
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
let modalState = null;

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
    if (first) first.focus({ preventScroll: false });
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

function openEditClient(id) {
  const c = clientsCache.find(x => x.id === id);
  if (!c) return;
  openModal("Ndrysho klientin", `
    <label>Emri *</label>
    <input name="emri" required value="${esc(c.emri)}">
    <label>Tipi</label>
    <select name="tipi">
      <option value="restorant" ${c.tipi === "restorant" ? "selected" : ""}>Restorant</option>
      <option value="kafene" ${c.tipi === "kafene" ? "selected" : ""}>Kafene</option>
      <option value="tjeter" ${c.tipi === "tjeter" ? "selected" : ""}>Tjetër</option>
    </select>
    <label>Telefoni</label>
    <input name="telefoni" value="${esc(c.telefoni)}">
    <label>Email</label>
    <input type="email" name="email" value="${esc(c.email)}">
    <label>Adresa</label>
    <input name="adresa" value="${esc(c.adresa)}">
  `, async fd => {
    await api(`/api/admin/clients/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        emri: fd.get("emri"),
        tipi: fd.get("tipi"),
        telefoni: fd.get("telefoni"),
        email: fd.get("email"),
        adresa: fd.get("adresa"),
      }),
    });
  });
}

function waiterLink(clientId) {
  return `${window.location.origin}/waiter/${clientId}`;
}

function ownerLoginLink(email) {
  const q = new URLSearchParams({ email: String(email || "").trim() });
  return `${window.location.origin}/owner/login?${q.toString()}`;
}

let qrBlobUrl = null;

function closeQrModal() {
  document.getElementById("modal-qr").classList.add("hidden");
  const img = document.getElementById("qr-modal-img");
  if (qrBlobUrl) {
    URL.revokeObjectURL(qrBlobUrl);
    qrBlobUrl = null;
  }
  if (img) img.removeAttribute("src");
}

document.getElementById("qr-modal-close")?.addEventListener("click", closeQrModal);
document.getElementById("qr-modal-backdrop")?.addEventListener("click", closeQrModal);
document.getElementById("qr-modal-copy")?.addEventListener("click", async function () {
  const url = document.getElementById("qr-modal-url")?.textContent;
  if (!url) return;
  await copyText(url, this);
});

async function openQrModal(title, hint, targetUrl) {
  document.getElementById("qr-modal-title").textContent = title;
  document.getElementById("qr-modal-hint").textContent = hint;
  document.getElementById("qr-modal-url").textContent = targetUrl;
  const img = document.getElementById("qr-modal-img");
  const errEl = document.getElementById("qr-modal-error");
  errEl.classList.add("hidden");
  img.alt = "Duke gjeneruar QR…";
  img.removeAttribute("src");
  document.getElementById("modal-qr").classList.remove("hidden");

  try {
    const res = await fetch(apiUrl(`/api/admin/qr?url=${encodeURIComponent(targetUrl)}`), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.gabim || `HTTP ${res.status}`);
    }
    const blob = await res.blob();
    if (qrBlobUrl) URL.revokeObjectURL(qrBlobUrl);
    qrBlobUrl = URL.createObjectURL(blob);
    img.src = qrBlobUrl;
    img.alt = "QR Code";
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove("hidden");
  }
}

function kitchenLink(clientId) {
  return `${window.location.origin}/kitchen/${clientId}`;
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

function syncLicenseAppTypeFromClient() {
  const clientSel = document.getElementById("l-client");
  const appSel = document.getElementById("l-app-type");
  if (!clientSel || !appSel || !clientSel.value) return;
  const client = clientsCache.find(c => c.id === clientSel.value);
  if (client && (client.tipi === "restorant" || client.tipi === "kafene")) {
    appSel.value = client.tipi;
  }
}

async function copyWaiterLink(clientId, btn) {
  await copyLink(waiterLink(clientId), btn);
}

async function copyKitchenLink(clientId, btn) {
  await copyLink(kitchenLink(clientId), btn);
}

function openEditLicense(id) {
  const l = licensesCache.find(x => x.id === id);
  if (!l) return;
  openModal("Ndrysho liçencën", `
    <label>Kodi i licencës</label>
    <input value="${esc(l.celesi)}" readonly class="mono" style="opacity:0.85">
    <label>Tipi i aplikacionit</label>
    <select name="app_type">
      <option value="restorant" ${(l.app_type || l.clients?.tipi) === "restorant" ? "selected" : ""}>Restorant</option>
      <option value="kafene" ${(l.app_type || l.clients?.tipi) === "kafene" ? "selected" : ""}>Kafene</option>
    </select>
    <label>ID pajisjes (nga POS)</label>
    <input name="device_id" value="${esc(l.device_id || "")}" placeholder="p.sh. AD503FC5608A" class="mono" autocomplete="off">
    <label>Kompjuteri (hostname)</label>
    <input value="${esc(l.device_hostname || "—")}" readonly class="mono" style="opacity:0.85">
    <label>Aktivizuar për herë të fundit</label>
    <input value="${esc(fmtDateTime(l.last_activated_at))}" readonly style="opacity:0.85">
    <label>IP e fundit</label>
    <input value="${esc(l.last_ip || "—")}" readonly class="mono" style="opacity:0.85">
    ${l.last_validation_error ? `<div class="alert alert-error" style="margin-bottom:0.75rem">⚠️ ${esc(l.last_validation_error)}</div>` : ""}
    <p style="font-size:0.8rem;color:var(--muted);margin:-0.35rem 0 0.75rem">Plotësohet kur POS aktivizon online. Lëreni bosh për «Pa aktivizuar».</p>
    <label>Data e skadimit</label>
    <input type="date" name="data_skadimit" required value="${esc(l.data_skadimit)}">
    <label>Statusi</label>
    <select name="statusi">
      <option value="aktive" ${l.statusi === "aktive" ? "selected" : ""}>aktive</option>
      <option value="skaduar" ${l.statusi === "skaduar" ? "selected" : ""}>skaduar</option>
      <option value="revokuar" ${l.statusi === "revokuar" ? "selected" : ""}>revokuar</option>
      <option value="pezulluar" ${l.statusi === "pezulluar" ? "selected" : ""}>pezulluar</option>
    </select>
  `, async fd => {
    await api(`/api/admin/licenses/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        data_skadimit: fd.get("data_skadimit"),
        statusi: fd.get("statusi"),
        device_id: fd.get("device_id"),
        app_type: fd.get("app_type"),
      }),
    });
  });
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
  scope.querySelectorAll("[data-edit-client]").forEach(btn => {
    btn.onclick = () => openEditClient(btn.dataset.editClient);
  });
  scope.querySelectorAll("[data-edit-license]").forEach(btn => {
    btn.onclick = () => openEditLicense(btn.dataset.editLicense);
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
  document.getElementById("stats").innerHTML = `
    <div class="stat"><div class="val">${s.clients_total}</div><div class="lbl">Klientë</div></div>
    <div class="stat"><div class="val">${s.licenses_total}</div><div class="lbl">Liçensa</div></div>
    <div class="stat"><div class="val">${s.licenses_active}</div><div class="lbl">Aktive</div></div>
    <div class="stat"><div class="val">${s.licenses_expired}</div><div class="lbl">Skaduar</div></div>
    <div class="stat"><div class="val">${s.licenses_revoked}</div><div class="lbl">Revokuar</div></div>`;
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

function updateOwnerFormState(clients) {
  const prereq = document.getElementById("owner-prereq");
  const oSel = document.getElementById("o-client");
  const form = document.getElementById("form-owner");
  const btn = form?.querySelector('button[type="submit"]');
  const hasClients = Array.isArray(clients) && clients.length > 0;

  if (prereq) prereq.classList.toggle("hidden", hasClients);

  if (!oSel) return;

  if (!hasClients) {
    oSel.innerHTML = '<option value="" disabled selected>— Shto klient së pari —</option>';
    oSel.disabled = true;
    if (btn) btn.disabled = true;
    return;
  }

  oSel.disabled = false;
  if (btn) btn.disabled = false;
  const prev = oSel.value;
  oSel.innerHTML = '<option value="" disabled selected hidden>Zgjidh klientin…</option>' +
    clients.map(c => `<option value="${c.id}">${esc(c.emri)} (${esc(c.tipi)})</option>`).join("");
  if (prev && clients.some(c => c.id === prev)) oSel.value = prev;
}

async function loadClients() {
  const { clients } = await api("/api/admin/clients");
  clientsCache = clients;
  const sel = document.getElementById("l-client");
  const opts = clients.length
    ? clients.map(c => `<option value="${c.id}">${esc(c.emri)} (${esc(c.tipi)})</option>`).join("")
    : '<option value="" disabled selected>— Shto klient së pari (+ Shto) —</option>';
  if (sel) {
    sel.innerHTML = opts;
    sel.disabled = !clients.length;
    sel.onchange = syncLicenseAppTypeFromClient;
    syncLicenseAppTypeFromClient();
  }
  updateOwnerFormState(clients);
  const tbl = document.getElementById("tbl-clients");
  tbl.innerHTML = clients.length
    ? clients.map(c => `<tr>
        <td data-label="Emri"><strong>${esc(c.emri)}</strong></td>
        <td data-label="Tipi">${esc(c.tipi)}</td>
        <td data-label="Telefoni">${esc(c.telefoni) || "—"}</td>
        <td data-label="Email">${esc(c.email) || "—"}</td>
        <td data-label="Adresa">${esc(c.adresa) || "—"}</td>
        <td data-label="Liç.">${c.licenses?.[0]?.count ?? 0}</td>
        <td data-label="Regj.">${fmtDate(c.created_at)}</td>
        <td class="kds-link-cell" data-label="Linqet">
          <div class="link-btns">
            <button type="button" class="btn btn-ghost btn-sm" data-qr-waiter="${esc(c.id)}">QR Kamarier</button>
            <button type="button" class="btn btn-ghost btn-sm" data-copy-waiter="${esc(c.id)}">Kamarier</button>
            <button type="button" class="btn btn-ghost btn-sm" data-copy-kitchen="${esc(c.id)}">Kuzhina</button>
          </div>
        </td>
        <td class="actions col-actions" data-label="Veprime">
          <button class="btn btn-ghost btn-sm" data-edit-client="${c.id}">Ndrysho</button>
          <button class="btn btn-danger btn-sm" data-del-client="${c.id}">Fshi</button>
        </td>
      </tr>`).join("")
    : '<tr><td colspan="9" style="color:var(--muted)">Nuk ka klientë</td></tr>';
  bindTableActions(tbl);
  tbl.querySelectorAll("[data-copy-kitchen]").forEach(btn => {
    btn.addEventListener("click", () => copyKitchenLink(btn.dataset.copyKitchen, btn));
  });
  tbl.querySelectorAll("[data-copy-waiter]").forEach(btn => {
    btn.addEventListener("click", () => copyWaiterLink(btn.dataset.copyWaiter, btn));
  });
  tbl.querySelectorAll("[data-qr-waiter]").forEach(btn => {
    btn.addEventListener("click", () => {
      const c = clientsCache.find(x => x.id === btn.dataset.qrWaiter);
      const url = waiterLink(btn.dataset.qrWaiter);
      openQrModal(
        `QR Kamarier — ${c?.emri || "Lokal"}`,
        "Printo dhe vë në lokal. Kamarieri skanon me telefon → hap app-in e porosive.",
        url,
      );
    });
  });
  return clients;
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

async function loadLicenses() {
  const { licenses } = await api("/api/admin/licenses");
  licensesCache = licenses;
  const tbl = document.getElementById("tbl-licenses");
  tbl.innerHTML = licenses.length
    ? licenses.map(l => {
        const devId = (l.device_id || "").trim();
        return `<tr>
        <td data-label="Klienti">${esc(l.clients?.emri) || "—"} <small style="color:var(--muted)">(${esc(l.clients?.tipi) || ""})</small></td>
        <td data-label="App">${licenseAppTypeLabel(l)}</td>
        <td class="license-key-cell" data-label="Kodi">
          <code class="mono">${esc(l.celesi)}</code>
          <button type="button" class="btn btn-ghost btn-sm" data-copy-text="${esc(l.celesi)}">Kopjo</button>
        </td>
        <td class="device-id-cell" data-label="ID Pajisjes">
          ${devId
            ? `<code class="mono device-id-badge">${esc(devId)}</code>
               <button type="button" class="btn btn-ghost btn-sm" data-copy-device-id="${l.id}">Kopjo ID</button>`
            : '<span class="device-pending">Pa aktivizuar</span>'}
        </td>
        <td data-label="Kompjuteri">${esc(l.device_hostname) || "—"}</td>
        <td data-label="Aktivizuar">${fmtDateTime(l.last_activated_at)}</td>
        <td data-label="IP" class="mono">${esc(l.last_ip) || "—"}</td>
        <td data-label="Statusi">${licenseStatusCell(l)}</td>
        <td data-label="Nga">${l.data_fillimit}</td>
        <td data-label="Deri">${l.data_skadimit}</td>
        <td class="actions col-actions" data-label="Veprime">
          <button class="btn btn-ghost btn-sm" data-edit-license="${l.id}">Ndrysho</button>
          <button class="btn btn-danger btn-sm" data-del-license="${l.id}">Fshi</button>
          ${l.statusi !== "aktive" ? `<button class="btn btn-ghost btn-sm" data-act="aktive" data-id="${l.id}">Aktivizo</button>` : ""}
          ${l.statusi !== "revokuar" ? `<button class="btn btn-ghost btn-sm" data-act="revokuar" data-id="${l.id}">Revoko</button>` : ""}
          <button class="btn btn-ghost btn-sm" data-reset="${l.id}" title="Hiq lidhjen — lejon ID tjetër">Reset ID</button>
        </td>
      </tr>`;
      }).join("")
    : '<tr><td colspan="11" style="color:var(--muted)">Nuk ka liçensa</td></tr>';

  tbl.querySelectorAll("[data-copy-text]").forEach(btn => {
    btn.addEventListener("click", () => copyText(btn.dataset.copyText, btn));
  });
  tbl.querySelectorAll("[data-copy-device-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const lic = licensesCache.find(x => x.id === btn.dataset.copyDeviceId);
      const id = (lic?.device_id || "").trim();
      if (id) copyText(id, btn);
      else alert("Nuk ka ID pajisje.");
    });
  });

  tbl.querySelectorAll("[data-act]").forEach(btn => {
    btn.onclick = async () => {
      await api(`/api/admin/licenses/${btn.dataset.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ statusi: btn.dataset.act }),
      });
      await refreshAll();
    };
  });
  tbl.querySelectorAll("[data-reset]").forEach(btn => {
    btn.onclick = async () => {
      if (!confirm("Hiq lidhjen me pajisjen aktuale?")) return;
      await api(`/api/admin/licenses/${btn.dataset.id}/reset-device`, { method: "POST" });
      await refreshAll();
    };
  });
  bindTableActions(tbl);
}

async function loadOwners() {
  const { owners } = await api("/api/admin/owners");
  ownersCache = owners;
  const tbl = document.getElementById("tbl-owners");
  tbl.innerHTML = owners.length
    ? owners.map(o => {
        const inviteBtn = o.invite_url
          ? `<button type="button" class="btn btn-ghost btn-sm" data-copy-invite-id="${o.id}">Kopjo linkun e ftesës</button>`
          : "";
        const renewBtn = o.account_status === "pending"
          ? `<button type="button" class="btn btn-ghost btn-sm" data-renew-invite="${o.id}">Link i ri (48h)</button>`
          : "";
        return `<tr>
        <td data-label="Emri"><strong>${esc(o.emri)}</strong></td>
        <td data-label="Email">${esc(o.email)}</td>
        <td data-label="Restoranti">${esc(o.clients?.emri) || "—"} <small style="color:var(--muted)">(${esc(o.clients?.tipi) || ""})</small></td>
        <td data-label="Llogaria">${ownerStatusBadge(o)}</td>
        <td data-label="Regj.">${fmtDate(o.created_at)}</td>
        <td class="actions col-actions" data-label="Veprime">
          <button type="button" class="btn btn-ghost btn-sm" data-qr-owner="${o.id}">QR Hyrje</button>
          ${inviteBtn}
          ${renewBtn}
          <button class="btn btn-ghost btn-sm" data-edit-owner="${o.id}">Ndrysho</button>
          <button class="btn btn-danger btn-sm" data-del-owner="${o.id}">Fshi</button>
        </td>
      </tr>`;
      }).join("")
    : '<tr><td colspan="6" style="color:var(--muted)">Nuk ka pronarë</td></tr>';
  tbl.querySelectorAll("[data-copy-invite-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const o = ownersCache.find(x => x.id === btn.dataset.copyInviteId);
      if (o?.invite_url) copyText(o.invite_url, btn);
      else alert("Linku i ftesës nuk është i disponueshëm.");
    });
  });
  tbl.querySelectorAll("[data-qr-owner]").forEach(btn => {
    btn.addEventListener("click", () => {
      const o = ownersCache.find(x => x.id === btn.dataset.qrOwner);
      if (!o?.email) return;
      openQrModal(
        `QR Hyrje — ${o.emri}`,
        "Pronari skanon → hap hyrjen me email të para-plotësuar. Vendos vetëm fjalëkalimin.",
        ownerLoginLink(o.email),
      );
    });
  });
  tbl.querySelectorAll("[data-renew-invite]").forEach(btn => {
    btn.addEventListener("click", async () => {
      try {
        const { owner } = await api(`/api/admin/owners/${btn.dataset.renewInvite}/invite`, { method: "POST" });
        if (owner?.invite_url) await copyText(owner.invite_url, btn);
        await refreshAll();
      } catch (err) {
        alert(err.message);
      }
    });
  });
  bindTableActions(tbl);
}

async function refreshAll() {
  showAdminError(null);
  try {
    await loadStats();
    await loadClients();
    await loadLicenses();
    await loadOwners();
  } catch (e) {
    showAdminError(`Gabim ngarkimi: ${e.message}. Rifresko faqen (Ctrl+F5).`);
    throw e;
  }
}

function showApp(user) {
  show("view-login", false);
  show("view-app", true);
  document.getElementById("user-label").textContent = user.emri || user.email;
  setupOwnerLoginUrl();
}

function setupOwnerLoginUrl() {
  const input = document.getElementById("owner-login-url");
  if (input) input.value = `${window.location.origin}/owner/login`;
}

function showLogin() {
  token = "";
  localStorage.removeItem("rip_token");
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
  showLogin();
});

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    document.querySelectorAll(".panel-section").forEach(p => p.classList.add("hidden"));
    document.getElementById(`panel-${tab.dataset.tab}`).classList.remove("hidden");
    if (tab.dataset.tab === "licensat") loadLicenses().catch(() => {});
  });
});

document.getElementById("form-client").addEventListener("submit", async e => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  try {
    await api("/api/admin/clients", {
      method: "POST",
      body: JSON.stringify({
        emri: document.getElementById("c-emri").value,
        tipi: document.getElementById("c-tipi").value,
        telefoni: document.getElementById("c-telefoni").value,
        email: document.getElementById("c-email").value,
        adresa: document.getElementById("c-adresa").value,
      }),
    });
    showMsg("msg-client", "Klienti u shtua!", true);
    e.target.reset();
    await safeRefresh();
  } catch (err) {
    showMsg("msg-client", err.message, false);
  } finally {
    btn.disabled = false;
  }
});

document.getElementById("btn-gen-key").addEventListener("click", async () => {
  const { celesi } = await api("/api/admin/licenses/generate-key");
  document.getElementById("l-celesi").value = celesi;
});

document.getElementById("form-license").addEventListener("submit", async e => {
  e.preventDefault();
  try {
    const res = await api("/api/admin/licenses", {
      method: "POST",
      body: JSON.stringify({
        client_id: document.getElementById("l-client").value,
        app_type: document.getElementById("l-app-type").value,
        celesi: document.getElementById("l-celesi").value,
        muaj: document.getElementById("l-muaj").value,
        device_id: document.getElementById("l-device").value,
      }),
    });
    showMsg("msg-license", `Liçenca u krijua: ${res.license.celesi}`, true);
    document.getElementById("l-celesi").value = "";
    document.getElementById("l-device").value = "";
    await refreshAll();
  } catch (err) {
    showMsg("msg-license", err.message, false);
  }
});

document.getElementById("btn-goto-add-client")?.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelector('[data-tab="shto"]')?.classList.add("active");
  document.querySelectorAll(".panel-section").forEach(p => p.classList.add("hidden"));
  document.getElementById("panel-shto")?.classList.remove("hidden");
  document.getElementById("c-emri")?.focus();
});

document.getElementById("form-owner").addEventListener("submit", async e => {
  e.preventDefault();
  if (!clientsCache.length) {
    showMsg("msg-owner", "Së pari shtoni një klient në tab + Shto.", false);
    return;
  }
  if (!document.getElementById("o-client").value) {
    showMsg("msg-owner", "Zgjidhni klientin (restorantin) për këtë pronar.", false);
    return;
  }
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  try {
    const res = await api("/api/admin/owners", {
      method: "POST",
      body: JSON.stringify({
        client_id: document.getElementById("o-client").value,
        emri: document.getElementById("o-emri").value,
        email: document.getElementById("o-email").value,
      }),
    });
    let msg = "Llogaria u krijua!";
    if (res.owner?.invite_url) {
      try {
        await navigator.clipboard.writeText(res.owner.invite_url);
        msg = "U krijua! Linku i ftesës u kopjua — dërgoje pronarit (48 orë).";
      } catch {
        msg = `U krijua! Link ftese: ${res.owner.invite_url}`;
      }
    }
    showMsg("msg-owner", msg, true);
    e.target.reset();
    await safeRefresh();
  } catch (err) {
    showMsg("msg-owner", err.message, false);
  } finally {
    btn.disabled = false;
  }
});

(async () => {
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
