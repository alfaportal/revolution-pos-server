let token = localStorage.getItem("rip_token") || "";

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

function kitchenLink(clientId) {
  return `${window.location.origin}/kitchen/${clientId}`;
}

function waiterLink(clientId) {
  return `${window.location.origin}/waiter/${clientId}`;
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

async function copyKitchenLink(clientId, btn) {
  await copyLink(kitchenLink(clientId), btn);
}

async function copyWaiterLink(clientId, btn) {
  await copyLink(waiterLink(clientId), btn);
}

function openEditLicense(id) {
  const l = licensesCache.find(x => x.id === id);
  if (!l) return;
  openModal("Ndrysho liçencën", `
    <p class="mono" style="margin-bottom:0.75rem;color:var(--muted)">${esc(l.celesi)}</p>
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

async function loadClients() {
  const { clients } = await api("/api/admin/clients");
  clientsCache = clients;
  const sel = document.getElementById("l-client");
  const oSel = document.getElementById("o-client");
  const opts = clients.map(c => `<option value="${c.id}">${c.emri} (${c.tipi})</option>`).join("");
  sel.innerHTML = opts;
  if (oSel) oSel.innerHTML = opts;
  const tbl = document.getElementById("tbl-clients");
  tbl.innerHTML = clients.length
    ? clients.map(c => `<tr>
        <td><strong>${esc(c.emri)}</strong></td>
        <td>${esc(c.tipi)}</td>
        <td>${esc(c.telefoni) || "—"}</td>
        <td>${esc(c.email) || "—"}</td>
        <td>${esc(c.adresa) || "—"}</td>
        <td>${c.licenses?.[0]?.count ?? 0}</td>
        <td>${fmtDate(c.created_at)}</td>
        <td class="kds-link-cell">
          <div style="display:flex;flex-direction:column;gap:0.35rem;align-items:flex-start">
            <span class="mono" style="font-size:0.7rem">/waiter/${esc(c.id)}</span>
            <button type="button" class="btn btn-ghost btn-sm" data-copy-waiter="${esc(c.id)}">Kopjo</button>
          </div>
        </td>
        <td class="kds-link-cell">
          <div style="display:flex;flex-direction:column;gap:0.35rem;align-items:flex-start">
            <a href="/kitchen/${esc(c.id)}" target="_blank" rel="noopener" class="mono" style="font-size:0.7rem">Kuzhina</a>
            <button type="button" class="btn btn-ghost btn-sm" data-copy-kitchen="${esc(c.id)}">Kopjo</button>
          </div>
        </td>
        <td class="actions">
          <button class="btn btn-ghost btn-sm" data-edit-client="${c.id}">Ndrysho</button>
          <button class="btn btn-danger btn-sm" data-del-client="${c.id}">Fshi</button>
        </td>
      </tr>`).join("")
    : '<tr><td colspan="10" style="color:var(--muted)">Nuk ka klientë</td></tr>';
  bindTableActions(tbl);
  tbl.querySelectorAll("[data-copy-kitchen]").forEach(btn => {
    btn.addEventListener("click", () => copyKitchenLink(btn.dataset.copyKitchen, btn));
  });
  tbl.querySelectorAll("[data-copy-waiter]").forEach(btn => {
    btn.addEventListener("click", () => copyWaiterLink(btn.dataset.copyWaiter, btn));
  });
  return clients;
}

async function loadLicenses() {
  const { licenses } = await api("/api/admin/licenses");
  licensesCache = licenses;
  const tbl = document.getElementById("tbl-licenses");
  tbl.innerHTML = licenses.length
    ? licenses.map(l => `<tr>
        <td>${esc(l.clients?.emri) || "—"} <small style="color:var(--muted)">(${esc(l.clients?.tipi) || ""})</small></td>
        <td class="mono">${esc(l.celesi)}</td>
        <td class="mono">${esc(l.device_id) || "—"}</td>
        <td>${badge(l.statusi)}</td>
        <td>${l.data_fillimit}</td>
        <td>${l.data_skadimit}</td>
        <td class="actions" style="white-space:nowrap">
          <button class="btn btn-ghost btn-sm" data-edit-license="${l.id}">Ndrysho</button>
          <button class="btn btn-danger btn-sm" data-del-license="${l.id}">Fshi</button>
          ${l.statusi !== "aktive" ? `<button class="btn btn-ghost btn-sm" data-act="aktive" data-id="${l.id}">Aktivizo</button>` : ""}
          ${l.statusi !== "revokuar" ? `<button class="btn btn-ghost btn-sm" data-act="revokuar" data-id="${l.id}">Revoko</button>` : ""}
          <button class="btn btn-ghost btn-sm" data-reset="${l.id}">Reset pajisje</button>
        </td>
      </tr>`).join("")
    : '<tr><td colspan="7" style="color:var(--muted)">Nuk ka liçensa</td></tr>';

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
    ? owners.map(o => `<tr>
        <td><strong>${esc(o.emri)}</strong></td>
        <td>${esc(o.email)}</td>
        <td>${esc(o.clients?.emri) || "—"} <small style="color:var(--muted)">(${esc(o.clients?.tipi) || ""})</small></td>
        <td>${o.aktiv !== false ? '<span class="badge badge-aktive">aktiv</span>' : '<span class="badge badge-revokuar">çaktiv</span>'}</td>
        <td>${fmtDate(o.created_at)}</td>
        <td class="actions">
          <button class="btn btn-ghost btn-sm" data-edit-owner="${o.id}">Ndrysho</button>
          <button class="btn btn-danger btn-sm" data-del-owner="${o.id}">Fshi</button>
        </td>
      </tr>`).join("")
    : '<tr><td colspan="6" style="color:var(--muted)">Nuk ka pronarë</td></tr>';
  bindTableActions(tbl);
}

async function refreshAll() {
  await loadStats();
  await loadClients();
  await loadLicenses();
  await loadOwners();
}

function showApp(user) {
  show("view-login", false);
  show("view-app", true);
  document.getElementById("user-label").textContent = user.emri || user.email;
}

function showLogin() {
  token = "";
  localStorage.removeItem("rip_token");
  show("view-app", false);
  show("view-login", true);
}

document.getElementById("form-login").addEventListener("submit", async e => {
  e.preventDefault();
  const errEl = document.getElementById("login-error");
  errEl.classList.add("hidden");
  try {
    const res = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
      }),
    });
    token = res.token;
    localStorage.setItem("rip_token", token);
    showApp(res.user);
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

document.getElementById("form-owner").addEventListener("submit", async e => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  try {
    await api("/api/admin/owners", {
      method: "POST",
      body: JSON.stringify({
        client_id: document.getElementById("o-client").value,
        emri: document.getElementById("o-emri").value,
        email: document.getElementById("o-email").value,
        password: document.getElementById("o-password").value,
      }),
    });
    showMsg("msg-owner", "Llogaria e pronarit u krijua!", true);
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
