const routes = [];

export function onRoute(pattern, handler) {
  const keys = [];
  const regex = new RegExp(
    "^" +
      pattern.replace(/\//g, "\\/").replace(/:([a-zA-Z]+)/g, (_, key) => {
        keys.push(key);
        return "([^/]+)";
      }) +
      "$"
  );
  routes.push({ regex, keys, handler });
}

export function navigate(path) {
  const hashIndex = path.indexOf("#");
  const hash = hashIndex >= 0 ? path.slice(hashIndex + 1) : "";
  const pathname = hashIndex >= 0 ? path.slice(0, hashIndex) || "/" : path;
  window.history.pushState({}, "", hash ? `${pathname}#${hash}` : pathname);
  resolveRoute();
  if (hash) {
    requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
    });
  }
}

export function getCurrentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

export function resolveRoute() {
  const path = getCurrentPath();
  for (const route of routes) {
    const match = path.match(route.regex);
    if (!match) continue;
    const params = {};
    route.keys.forEach((key, index) => {
      params[key] = decodeURIComponent(match[index + 1]);
    });
    route.handler(params);
    return;
  }
  routes.find((r) => r.regex.source === "^\\/$")?.handler({});
}

export function initRouter() {
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-navigate]");
    if (!link) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(link.getAttribute("href"));
  });

  window.addEventListener("popstate", resolveRoute);
  resolveRoute();
}
