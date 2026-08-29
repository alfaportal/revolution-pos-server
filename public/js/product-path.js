(function (root) {
  function parseProductPath(pathname) {
    const parts = String(pathname || "").split("/").filter(Boolean);
    if (parts.length < 2) {
      return { tipi: "", slug: "", role: "", table: 0 };
    }

    const legacyFirst = parts[0];
    if (legacyFirst === "waiter" && parts[1]) {
      return { tipi: "", slug: decodeURIComponent(parts[1]), role: "kamarier", table: 0 };
    }
    if (legacyFirst === "kitchen" && parts[1]) {
      return { tipi: "", slug: decodeURIComponent(parts[1]), role: "kuzhina", table: 0 };
    }
    if (legacyFirst === "bar" && parts[1]) {
      return { tipi: "", slug: decodeURIComponent(parts[1]), role: "bar", table: 0 };
    }
    if (legacyFirst === "menu" && parts[1]) {
      return {
        tipi: "",
        slug: decodeURIComponent(parts[1]),
        role: "menu",
        table: Number(parts[2]) || 0,
      };
    }
    if (legacyFirst === "restaurant" && parts[1]) {
      return {
        tipi: "",
        slug: decodeURIComponent(parts[1]),
        role: parts[2] || "public",
        table: parts[2] === "menu" && parts[3] ? Number(parts[3]) : 0,
      };
    }
    if (legacyFirst === "r" && parts[1]) {
      const slug = decodeURIComponent(parts[1]);
      if (parts[2] === "order") return { tipi: "", slug, role: "takeaway", table: 0 };
      if (parts[2] === "menu") return { tipi: "", slug, role: "menu", table: 0 };
      return { tipi: "", slug, role: "public", table: 0 };
    }

    const tipi = parts[0];
    const slug = decodeURIComponent(parts[1]);
    const role = parts[2] || "public";
    const table = role === "menu" && parts[3] ? Number(parts[3]) : 0;
    return { tipi, slug, role, table };
  }

  root.parseProductPath = parseProductPath;
})(typeof window !== "undefined" ? window : globalThis);
