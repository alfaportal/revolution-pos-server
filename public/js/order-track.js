(function (global) {
  const DEFAULT_POLL_MS = 3000;
  const TERMINAL = new Set(["ready", "closed", "cancelled"]);

  function renderSteps(container, phase) {
    if (!container) return;
    const steps = [
      { id: "pending", label: "Në pritje" },
      { id: "preparing", label: "Po përgatitet" },
      { id: "ready", label: "Gati" },
    ];
    const order = ["pending", "preparing", "ready", "closed"];
    const idx = Math.max(0, order.indexOf(phase));
    container.innerHTML = steps.map(s => {
      const stepIdx = order.indexOf(s.id);
      let cls = "order-track-step";
      if (phase === "cancelled") {
        cls += stepIdx === 0 ? " cancelled active" : " cancelled";
      } else if (phase === "closed") {
        cls += " done";
      } else if (stepIdx < idx) {
        cls += " done";
      } else if (stepIdx === idx) {
        cls += " active";
      }
      return `<li class="${cls}"><span class="order-track-dot" aria-hidden="true"></span><span>${s.label}</span></li>`;
    }).join("");
  }

  function start(opts) {
    let timer = null;
    let stopped = false;

    function stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
      timer = null;
    }

    async function tick() {
      if (stopped) return;
      try {
        const q = `token=${encodeURIComponent(opts.trackToken || "")}`;
        const url = opts.statusUrl.includes("?") ? `${opts.statusUrl}&${q}` : `${opts.statusUrl}?${q}`;
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.ok === false) {
          throw new Error(data.gabim || "Statusi nuk u lexua.");
        }
        if (opts.stepsEl) renderSteps(opts.stepsEl, data.phase);
        if (opts.labelEl) opts.labelEl.textContent = data.label || "";
        if (opts.detailEl) opts.detailEl.textContent = data.detail || "";
        if (typeof opts.onUpdate === "function") opts.onUpdate(data);
        if (TERMINAL.has(String(data.phase || ""))) {
          stop();
          return;
        }
      } catch (err) {
        if (typeof opts.onError === "function") opts.onError(err);
      }
      if (!stopped) {
        timer = setTimeout(tick, opts.pollMs || DEFAULT_POLL_MS);
      }
    }

    tick();
    return { stop };
  }

  global.OrderTrack = {
    start,
    renderSteps,
    DEFAULT_POLL_MS,
  };
})(window);
