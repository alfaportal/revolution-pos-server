/** Owner panel — blerje manuale (pa AI skanim). Ruaj → radhë POS → stok + kontabilist. */
(function () {
  const api = () => window.ownerApi;
  let menuItems = [];
  let lines = [{ name: "", quantity: 1, unit_price: 0 }];

  function setMsg(text, ok) {
    const el = document.getElementById("blerje-msg");
    if (!el) return;
    el.textContent = text || "";
    el.className = "owner-license-msg" + (text ? (ok ? " ok" : " err") : "");
  }

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function productOptions(selectedName) {
    const opts = [`<option value="">— Zgjidh produktin —</option>`];
    for (const it of menuItems) {
      const n = String(it.name || "").trim();
      if (!n) continue;
      const sel = selectedName && selectedName === n ? " selected" : "";
      opts.push(`<option value="${esc(n)}"${sel}>${esc(n)}</option>`);
    }
    return opts.join("");
  }

  function renderLines() {
    const body = document.getElementById("blerje-lines-body");
    if (!body) return;
    body.innerHTML = lines
      .map(
        (line, idx) => `<tr>
        <td>
          <select class="blerje-line-product" data-idx="${idx}">${productOptions(line.name)}</select>
        </td>
        <td><input type="number" class="blerje-line-qty" data-idx="${idx}" min="0.001" step="0.001" value="${Number(line.quantity) || 1}"></td>
        <td><input type="number" class="blerje-line-price" data-idx="${idx}" min="0" step="0.01" value="${Number(line.unit_price || 0).toFixed(2)}"></td>
        <td><button type="button" class="btn btn-ghost btn-sm blerje-line-del" data-idx="${idx}" ${lines.length <= 1 ? "disabled" : ""}>×</button></td>
      </tr>`,
      )
      .join("");

    body.querySelectorAll(".blerje-line-product").forEach((el) => {
      el.addEventListener("change", () => {
        const i = Number(el.dataset.idx);
        lines[i].name = el.value;
      });
    });
    body.querySelectorAll(".blerje-line-qty").forEach((el) => {
      el.addEventListener("input", () => {
        const i = Number(el.dataset.idx);
        lines[i].quantity = Number(el.value);
      });
    });
    body.querySelectorAll(".blerje-line-price").forEach((el) => {
      el.addEventListener("input", () => {
        const i = Number(el.dataset.idx);
        lines[i].unit_price = Number(el.value);
      });
    });
    body.querySelectorAll(".blerje-line-del").forEach((el) => {
      el.addEventListener("click", () => {
        const i = Number(el.dataset.idx);
        if (lines.length <= 1) return;
        lines.splice(i, 1);
        renderLines();
      });
    });
  }

  async function loadMenuForPurchase() {
    if (!api()) return;
    try {
      const data = await api()("/api/owner/menu");
      menuItems = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      menuItems.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "sq"));
    } catch {
      menuItems = [];
    }
    renderLines();
  }

  function todayIso() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function resetForm() {
    lines = [{ name: "", quantity: 1, unit_price: 0 }];
    const dateEl = document.getElementById("blerje-invoice-date");
    if (dateEl && !dateEl.value) dateEl.value = todayIso();
    const sup = document.getElementById("blerje-supplier");
    const num = document.getElementById("blerje-invoice-no");
    if (sup) sup.value = "";
    if (num) num.value = "";
    renderLines();
  }

  async function savePurchase() {
    const supplier = document.getElementById("blerje-supplier")?.value?.trim() || "";
    const invoice_number = document.getElementById("blerje-invoice-no")?.value?.trim() || "";
    const invoice_date = document.getElementById("blerje-invoice-date")?.value || todayIso();
    const items = lines
      .map((l) => ({
        name: String(l.name || "").trim(),
        quantity: Number(l.quantity),
        unit: "copë",
        pieces_per_pack: 1,
        unit_price: Number(l.unit_price) || 0,
      }))
      .filter((l) => l.name && l.quantity > 0);

    if (!supplier) {
      setMsg("Shkruani emrin e furnizuesit.", false);
      return;
    }
    if (!items.length) {
      setMsg("Shtoni të paktën një produkt me sasi > 0.", false);
      return;
    }
    if (!api()) {
      setMsg("Sesioni nuk është gati. Rifresko faqen.", false);
      return;
    }

    const btn = document.getElementById("btn-blerje-save");
    if (btn) btn.disabled = true;
    setMsg("Duke dërguar blerjen te POS…", true);
    try {
      const data = await api()("/api/owner/purchases", {
        method: "POST",
        body: JSON.stringify({ supplier, invoice_number, invoice_date, items }),
      });
      setMsg(
        data.message ||
          `U dërgua (${items.length} artikuj). POS e regjistron → stoku + Kontabilisti.`,
        true,
      );
      resetForm();
      if (typeof window.loadOwnerInventory === "function") {
        window.loadOwnerInventory().catch(() => {});
      }
      if (typeof window.loadOwnerStock === "function") {
        window.loadOwnerStock().catch(() => {});
      }
    } catch (err) {
      setMsg(err.message || "Ruajtja dështoi.", false);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function init() {
    const dateEl = document.getElementById("blerje-invoice-date");
    if (dateEl && !dateEl.value) dateEl.value = todayIso();
    document.getElementById("btn-blerje-add-line")?.addEventListener("click", () => {
      lines.push({ name: "", quantity: 1, unit_price: 0 });
      renderLines();
    });
    document.getElementById("btn-blerje-save")?.addEventListener("click", () => {
      savePurchase().catch((e) => setMsg(e.message, false));
    });
    loadMenuForPurchase().catch(() => renderLines());
  }

  window.loadOwnerBlerjePanel = loadMenuForPurchase;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
