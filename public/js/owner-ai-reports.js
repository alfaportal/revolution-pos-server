/** Owner panel — Raporte AI ditore */
(function () {
  let reportsCache = [];

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function euro(n) {
    const v = Number(n);
    if (!Number.isFinite(v)) return "0.00 €";
    return `${v.toFixed(2)} €`;
  }

  function setAiReportMsg(text, ok) {
    const el = document.getElementById("ai-report-msg");
    if (!el) return;
    el.textContent = text || "";
    el.className = "owner-license-msg" + (text ? (ok ? " ok" : " err") : "");
  }

  function renderTodayReport(report, today) {
    const summaryEl = document.getElementById("ai-report-today-summary");
    const detailsEl = document.getElementById("ai-report-today-details");
    const metaEl = document.getElementById("ai-report-today-meta");
    if (!summaryEl || !detailsEl) return;

    if (!report) {
      metaEl.textContent = today ? `Data: ${today}` : "";
      summaryEl.textContent = "Ende nuk ka raport për sot. Raporti gjenerohet automatikisht në 23:59.";
      detailsEl.innerHTML = "";
      return;
    }

    const json = report.report_json || {};
    const sales = json.sales || {};
    const profit = json.profit || {};
    metaEl.textContent = `Data: ${report.report_date}${report.email_sent_at ? " · Email u dërgua" : ""}`;
    summaryEl.textContent = report.summary_text || "—";
    detailsEl.innerHTML = `
      <div class="ai-report-stat"><div class="val">${euro(sales.total_revenue)}</div><div class="lbl">Shitje totale</div></div>
      <div class="ai-report-stat"><div class="val">${Number(sales.order_count || 0)}</div><div class="lbl">Porosi</div></div>
      <div class="ai-report-stat"><div class="val">${euro(profit.profit ?? sales.total_revenue)}</div><div class="lbl">Fitim i vlerësuar</div></div>
      <div class="ai-report-stat"><div class="val">${(json.top_items || []).length}</div><div class="lbl">Top artikuj</div></div>`;
  }

  function renderHistoryTable() {
    const body = document.getElementById("ai-reports-history-body");
    if (!body) return;
    if (!reportsCache.length) {
      body.innerHTML =
        '<tr><td colspan="5" style="color:var(--muted)">Nuk ka raporte ende — gjenerohen automatikisht çdo ditë.</td></tr>';
      return;
    }
    body.innerHTML = reportsCache
      .map(r => {
        const json = r.report_json || {};
        const sales = json.sales || {};
        const profit = json.profit || {};
        return `<tr>
          <td><strong>${esc(r.report_date)}</strong></td>
          <td>${euro(sales.total_revenue)}</td>
          <td>${Number(sales.order_count || 0)}</td>
          <td>${euro(profit.profit ?? sales.total_revenue)}</td>
          <td><button type="button" class="btn btn-ghost btn-sm btn-ai-report-view" data-date="${esc(r.report_date)}">Shiko</button></td>
        </tr>`;
      })
      .join("");

    body.querySelectorAll(".btn-ai-report-view").forEach(btn => {
      btn.addEventListener("click", () => {
        const report = reportsCache.find(r => r.report_date === btn.dataset.date);
        if (report) renderTodayReport(report, report.report_date);
        setAiReportMsg(`U shfaq raporti për ${btn.dataset.date}.`, true);
      });
    });
  }

  async function loadOwnerAiReports() {
    setAiReportMsg("Duke ngarkuar…", true);
    try {
      const data = await api("/api/owner/ai-reports");
      reportsCache = data.reports || [];
      renderHistoryTable();

      let todayReport = reportsCache.find(r => r.report_date === data.today);
      if (!todayReport) {
        try {
          const todayData = await api("/api/owner/ai-reports/today");
          todayReport = todayData.report;
          if (todayReport && !reportsCache.some(r => r.report_date === todayReport.report_date)) {
            reportsCache.unshift(todayReport);
            renderHistoryTable();
          }
        } catch {
          /* sot mund të mos ketë ende */
        }
      }
      renderTodayReport(todayReport, data.today);
      setAiReportMsg("", true);
    } catch (err) {
      setAiReportMsg(err.message, false);
    }
  }

  window.loadOwnerAiReports = loadOwnerAiReports;

  function applyAiReportsTab(data) {
    const tab = document.getElementById("tab-ai-reports");
    if (!tab || !data) return;
    const active = !!data.enabled;
    const needsUpgrade = !!data.configured && !data.paused && !data.package_ai;
    if (active) {
      tab.removeAttribute("hidden");
      tab.classList.remove("hidden");
    } else if (needsUpgrade) {
      tab.removeAttribute("hidden");
      tab.classList.remove("hidden");
      tab.title = "Kërkon Pako 4 — AI Profesionale";
    } else {
      tab.setAttribute("hidden", "");
      tab.classList.add("hidden");
    }
  }

  window.applyAiReportsTab = applyAiReportsTab;

  document.getElementById("btn-ai-report-refresh")?.addEventListener("click", () => {
    loadOwnerAiReports().catch(err => setAiReportMsg(err.message, false));
  });
})();
