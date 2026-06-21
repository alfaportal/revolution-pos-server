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
  const sel = document.getElementById("l-client");
  const oSel = document.getElementById("o-client");
  const opts = clients.map(c => `<option value="${c.id}">${c.emri} (${c.tipi})</option>`).join("");
  sel.innerHTML = opts;
  if (oSel) oSel.innerHTML = opts;
  document.getElementById("tbl-clients").innerHTML = clients.length
    ? clients.map(c => `<tr>
        <td><strong>${c.emri}</strong></td>
        <td>${c.tipi}</td>
        <td>${c.telefoni || "—"}</td>
        <td>${c.email || "—"}</td>
        <td>${c.adresa || "—"}</td>
        <td>${c.licenses?.[0]?.count ?? 0}</td>
        <td>${fmtDate(c.created_at)}</td>
      </tr>`).join("")
    : '<tr><td colspan="7" style="color:var(--muted)">Nuk ka klientë</td></tr>';
  return clients;
}

async function loadLicenses() {
  const { licenses } = await api("/api/admin/licenses");
  document.getElementById("tbl-licenses").innerHTML = licenses.length
    ? licenses.map(l => `<tr>
        <td>${l.clients?.emri || "—"} <small style="color:var(--muted)">(${l.clients?.tipi || ""})</small></td>
        <td class="mono">${l.celesi}</td>
        <td class="mono">${l.device_id || "—"}</td>
        <td>${badge(l.statusi)}</td>
        <td>${l.data_fillimit}</td>
        <td>${l.data_skadimit}</td>
        <td style="white-space:nowrap">
          ${l.statusi !== "aktive" ? `<button class="btn btn-ghost btn-sm" data-act="aktive" data-id="${l.id}">Aktivizo</button>` : ""}
          ${l.statusi !== "revokuar" ? `<button class="btn btn-danger btn-sm" data-act="revokuar" data-id="${l.id}">Revoko</button>` : ""}
          <button class="btn btn-ghost btn-sm" data-reset="${l.id}">Reset pajisje</button>
        </td>
      </tr>`).join("")
    : '<tr><td colspan="7" style="color:var(--muted)">Nuk ka liçensa</td></tr>';

  document.querySelectorAll("[data-act]").forEach(btn => {
    btn.onclick = async () => {
      await api(`/api/admin/licenses/${btn.dataset.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ statusi: btn.dataset.act }),
      });
      await refreshAll();
    };
  });
  document.querySelectorAll("[data-reset]").forEach(btn => {
    btn.onclick = async () => {
      if (!confirm("Hiq lidhjen me pajisjen aktuale?")) return;
      await api(`/api/admin/licenses/${btn.dataset.id}/reset-device`, { method: "POST" });
      await refreshAll();
    };
  });
}

async function loadOwners() {
  const { owners } = await api("/api/admin/owners");
  document.getElementById("tbl-owners").innerHTML = owners.length
    ? owners.map(o => `<tr>
        <td><strong>${o.emri}</strong></td>
        <td>${o.email}</td>
        <td>${o.clients?.emri || "—"} <small style="color:var(--muted)">(${o.clients?.tipi || ""})</small></td>
        <td>${o.aktiv !== false ? '<span class="badge badge-aktive">aktiv</span>' : '<span class="badge badge-revokuar">çaktiv</span>'}</td>
        <td>${fmtDate(o.created_at)}</td>
        <td>
          ${o.aktiv !== false
            ? `<button class="btn btn-danger btn-sm" data-owner-off="${o.id}">Çaktivizo</button>`
            : `<button class="btn btn-ghost btn-sm" data-owner-on="${o.id}">Aktivizo</button>`}
        </td>
      </tr>`).join("")
    : '<tr><td colspan="6" style="color:var(--muted)">Nuk ka pronarë</td></tr>';

  document.querySelectorAll("[data-owner-off]").forEach(btn => {
    btn.onclick = async () => {
      await api(`/api/admin/owners/${btn.dataset.ownerOff}/status`, {
        method: "PATCH",
        body: JSON.stringify({ aktiv: false }),
      });
      await refreshAll();
    };
  });
  document.querySelectorAll("[data-owner-on]").forEach(btn => {
    btn.onclick = async () => {
      await api(`/api/admin/owners/${btn.dataset.ownerOn}/status`, {
        method: "PATCH",
        body: JSON.stringify({ aktiv: true }),
      });
      await refreshAll();
    };
  });
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
