export const integrated = import.meta.env.VITE_INTEGRATED === "true";

export function siteRoot() {
  return integrated ? "/" : "/";
}

export function blogRoot() {
  return "/";
}

export function blogArticlePath(slug) {
  return `${blogRoot()}/${slug}`.replace(/\/+/g, "/");
}

export function assetPath(path) {
  const base = import.meta.env.BASE_URL || "/";
  return `${base}${path.replace(/^\//, "")}`;
}
