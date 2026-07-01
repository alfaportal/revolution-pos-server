/** Owner panel — skanim faturash furnizuesi me AI → stok automatik */
(function () {
  let invoiceScanItems = [];
  let invoiceScanPreviewUrl = null;
  let ingredientsForMatch = [];

  function escAttr(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  async function readImageFile(file, maxBytes, label) {
    if (!file) return null;
    if (file.size > maxBytes) {
      throw new Error(`${label} max ${Math.round(maxBytes / 1024)} KB.`);
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Nuk u lexua skedari."));
      reader.readAsDataURL(file);
    });
  }

  function setInvoiceScanStatus(text, ok) {
    const el = document.getElementById("invoice-scan-status");
    if (!el) return;
    if (!text) {
      el.textContent = "";
      el.className = "owner-license-msg";
      return;
    }
    el.textContent = text;
    el.className = `owner-license-msg ${ok ? "ok" : "err"}`;
  }

  function normalizeName(name) {
    return String(name || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "");
  }

  function suggestIngredientId(name) {
    const target = normalizeName(name);
    if (!target || !ingredientsForMatch.length) return "";
    const exact = ingredientsForMatch.find(i => normalizeName(i.name) === target);
    if (exact) return exact.id;
    const partial = ingredientsForMatch.find(i => {
      const n = normalizeName(i.name);
      return n.includes(target) || target.includes(n);
    });
    return partial?.id || "";
  }

  function ingredientOptionsHtml(selectedId) {
    const opts = ['<option value="">— Krijo i ri —</option>'];
    for (const ing of ingredientsForMatch) {
      const sel = ing.id === selectedId ? " selected" : "";
      opts.push(`<option value="${escAttr(ing.id)}"${sel}>${escAttr(ing.name)} (${escAttr(ing.unit)})</option>`);
    }
    return opts.join("");
  }

  function renderInvoiceScanItems() {
    const body = document.getElementById("invoice-scan-items-body");
    const results = document.getElementById("invoice-scan-results");
    if (!body || !results) return;
    if (!invoiceScanItems.length) {
      body.innerHTML = "";
      results.classList.add("hidden");
      return;
    }
    body.innerHTML = invoiceScanItems
      .map((item, idx) => {
        const matchId = item.ingredient_id || suggestIngredientId(item.name);
        return `<tr>
          <td><input type="text" class="invoice-scan-name" data-idx="${idx}" value="${escAttr(item.name)}"></td>
          <td><input type="number" class="invoice-scan-qty" data-idx="${idx}" min="0" step="0.001" value="${Number(item.quantity || 0)}"></td>
          <td>
            <select class="invoice-scan-unit" data-idx="${idx}">
              <option value="kg"${item.unit === "kg" ? " selected" : ""}>kg</option>
              <option value="l"${item.unit === "l" ? " selected" : ""}>l</option>
              <option value="copë"${item.unit === "copë" ? " selected" : ""}>copë</option>
            </select>
          </td>
          <td><input type="number" class="invoice-scan-price" data-idx="${idx}" min="0" step="0.01" value="${Number(item.unit_price || 0).toFixed(2)}"></td>
          <td><select class="invoice-scan-match" data-idx="${idx}">${ingredientOptionsHtml(matchId)}</select></td>
        </tr>`;
      })
      .join("");
    results.classList.remove("hidden");
  }

  function readInvoiceScanItemsFromDom() {
    return invoiceScanItems.map((item, idx) => {
      const name = document.querySelector(`.invoice-scan-name[data-idx="${idx}"]`)?.value?.trim();
      const quantity = Number(document.querySelector(`.invoice-scan-qty[data-idx="${idx}"]`)?.value);
      const unit = document.querySelector(`.invoice-scan-unit[data-idx="${idx}"]`)?.value || "copë";
      const unit_price = Number(document.querySelector(`.invoice-scan-price[data-idx="${idx}"]`)?.value);
      const ingredient_id = document.querySelector(`.invoice-scan-match[data-idx="${idx}"]`)?.value || "";
      return {
        name: name || item.name,
        quantity: Number.isFinite(quantity) ? quantity : item.quantity,
        unit,
        unit_price: Number.isFinite(unit_price) ? unit_price : item.unit_price,
        ingredient_id: ingredient_id || null,
        create_if_missing: !ingredient_id,
      };
    }).filter(item => item.name && Number.isFinite(item.quantity) && item.quantity > 0);
  }

  async function loadIngredientsForMatch() {
    try {
      const data = await api("/api/owner/ingredients");
      ingredientsForMatch = data.ingredients || [];
    } catch {
      ingredientsForMatch = [];
    }
  }

  async function openInvoiceScanModal() {
    invoiceScanItems = [];
    setInvoiceScanStatus("", true);
    document.getElementById("invoice-scan-results")?.classList.add("hidden");
    document.getElementById("invoice-scan-loading")?.classList.add("hidden");
    document.getElementById("invoice-scan-file").value = "";
    document.getElementById("invoice-scan-supplier").value = "";
    document.getElementById("invoice-scan-number").value = "";
    document.getElementById("btn-invoice-scan-run").disabled = true;
    if (invoiceScanPreviewUrl) {
      URL.revokeObjectURL(invoiceScanPreviewUrl);
      invoiceScanPreviewUrl = null;
    }
    document.getElementById("invoice-scan-preview-wrap")?.classList.add("hidden");
    await loadIngredientsForMatch();
    document.getElementById("invoice-scan-modal")?.classList.remove("hidden");
  }

  function closeInvoiceScanModal() {
    document.getElementById("invoice-scan-modal")?.classList.add("hidden");
  }

  async function runInvoiceScan() {
    const file = document.getElementById("invoice-scan-file")?.files?.[0];
    if (!file) {
      setInvoiceScanStatus("Zgjidhni një foto fillimisht.", false);
      return;
    }
    const runBtn = document.getElementById("btn-invoice-scan-run");
    const loading = document.getElementById("invoice-scan-loading");
    if (runBtn) runBtn.disabled = true;
    loading?.classList.remove("hidden");
    setInvoiceScanStatus("", true);
    document.getElementById("invoice-scan-results")?.classList.add("hidden");
    try {
      const photo = await readImageFile(file, 4_000_000, "Foto e faturës");
      const data = await api("/api/ai/scan-invoice", {
        method: "POST",
        body: JSON.stringify({ photo }),
      });
      invoiceScanItems = Array.isArray(data.items) ? data.items : [];
      document.getElementById("invoice-scan-supplier").value = data.supplier || "";
      document.getElementById("invoice-scan-number").value = data.invoice_number || "";
      renderInvoiceScanItems();
      setInvoiceScanStatus(
        `${invoiceScanItems.length} artikuj u gjetën (${Number(data.usage?.tokens_used || 0).toLocaleString("sq-AL")} tokenë).`,
        true,
      );
    } catch (err) {
      setInvoiceScanStatus(err.message, false);
    } finally {
      loading?.classList.add("hidden");
      if (runBtn) runBtn.disabled = false;
    }
  }

  async function applyInvoiceScan() {
    const items = readInvoiceScanItemsFromDom();
    const supplier = document.getElementById("invoice-scan-supplier")?.value?.trim() || "";
    const invoice_number = document.getElementById("invoice-scan-number")?.value?.trim() || "";
    if (!items.length) {
      setInvoiceScanStatus("Nuk ka artikuj për import.", false);
      return;
    }
    const applyBtn = document.getElementById("btn-invoice-scan-apply");
    if (applyBtn) applyBtn.disabled = true;
    setInvoiceScanStatus("Duke përditësuar stokun…", true);
    try {
      const data = await api("/api/owner/inventory/apply-invoice-scan", {
        method: "POST",
        body: JSON.stringify({ supplier, invoice_number, items }),
      });
      closeInvoiceScanModal();
      if (typeof window.loadOwnerInventory === "function") {
        await window.loadOwnerInventory();
      }
      if (typeof window.loadOwnerStock === "function") {
        await window.loadOwnerStock();
      }
      const msg = document.getElementById("inventory-msg");
      if (msg) {
        msg.textContent = `${data.applied_count} artikuj u importuan (${data.created_count} të rinj, ${data.updated_count} u përditësuan).`;
        msg.className = "owner-license-msg ok";
      }
    } catch (err) {
      setInvoiceScanStatus(err.message, false);
    } finally {
      if (applyBtn) applyBtn.disabled = false;
    }
  }

  function applyInvoiceScanAiButton(data) {
    const btn = document.getElementById("btn-invoice-scan-ai");
    if (!btn || !data) return;
    const active = !!data.enabled;
    const needsUpgrade = !!data.configured && !data.paused && !data.package_ai;
    if (active) {
      btn.removeAttribute("hidden");
      btn.disabled = false;
      btn.title = "Skano faturën e furnizuesit";
    } else if (needsUpgrade) {
      btn.removeAttribute("hidden");
      btn.disabled = true;
      btn.title = "Kërkon Pako 4 — AI Profesionale. Kontaktoni administratorin.";
    } else {
      btn.setAttribute("hidden", "");
      btn.disabled = false;
      btn.title = "";
    }
  }

  window.applyInvoiceScanAiButton = applyInvoiceScanAiButton;

  document.getElementById("btn-invoice-scan-ai")?.addEventListener("click", () => {
    openInvoiceScanModal().catch(err => setInvoiceScanStatus(err.message, false));
  });
  document.getElementById("invoice-scan-close")?.addEventListener("click", closeInvoiceScanModal);
  document.getElementById("invoice-scan-backdrop")?.addEventListener("click", closeInvoiceScanModal);
  document.getElementById("btn-invoice-scan-run")?.addEventListener("click", () => {
    runInvoiceScan().catch(err => setInvoiceScanStatus(err.message, false));
  });
  document.getElementById("btn-invoice-scan-apply")?.addEventListener("click", () => {
    applyInvoiceScan().catch(err => setInvoiceScanStatus(err.message, false));
  });
  document.getElementById("invoice-scan-file")?.addEventListener("change", e => {
    const file = e.target.files?.[0];
    const previewWrap = document.getElementById("invoice-scan-preview-wrap");
    const preview = document.getElementById("invoice-scan-preview");
    const runBtn = document.getElementById("btn-invoice-scan-run");
    if (!file) {
      if (runBtn) runBtn.disabled = true;
      previewWrap?.classList.add("hidden");
      return;
    }
    if (invoiceScanPreviewUrl) URL.revokeObjectURL(invoiceScanPreviewUrl);
    invoiceScanPreviewUrl = URL.createObjectURL(file);
    if (preview) preview.src = invoiceScanPreviewUrl;
    previewWrap?.classList.remove("hidden");
    if (runBtn) runBtn.disabled = false;
    invoiceScanItems = [];
    document.getElementById("invoice-scan-results")?.classList.add("hidden");
    setInvoiceScanStatus("", true);
  });
})();
