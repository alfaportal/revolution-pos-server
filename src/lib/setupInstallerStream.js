/**
 * Setup Windows — shkarkohet për klientin VETËM nga domain-i ynë.
 * Burimi mund të jetë skedar lokal ose URL interne (p.sh. GitHub) — klientit NUK i shfaqet GitHub.
 */
const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");
const { getSetupDownloadUrl, getSetupVersion } = require("./publicOrigin");

const SETUP_FILENAME = "KAFENE-Setup.exe";

function localSetupPath() {
  const fromEnv = String(process.env.SETUP_LOCAL_PATH || "").trim();
  if (fromEnv) return fromEnv;
  return path.join(__dirname, "..", "..", "public", "downloads", SETUP_FILENAME);
}

function resolveSetupSource(plan) {
  const local = localSetupPath();
  try {
    if (local && fs.existsSync(local) && fs.statSync(local).isFile()) {
      return { type: "file", path: local };
    }
  } catch {
    /* ignore */
  }
  const url = getSetupDownloadUrl(plan);
  if (!url) return null;
  return { type: "url", url };
}

function setupContentDisposition() {
  const ver = getSetupVersion();
  const name = ver ? `KAFENE-Setup-${ver}.exe` : SETUP_FILENAME;
  return `attachment; filename="${name}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

/**
 * Stream Setup te klienti (attachment). Asnjë redirect te GitHub.
 * @returns {Promise<boolean>} true nëse stream filloi
 */
async function streamSetupInstaller(res, plan) {
  const source = resolveSetupSource(plan);
  if (!source) return false;

  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Content-Type", "application/octet-stream");
  res.set("Content-Disposition", setupContentDisposition());

  if (source.type === "file") {
    const stat = fs.statSync(source.path);
    res.set("Content-Length", String(stat.size));
    fs.createReadStream(source.path).pipe(res);
    return true;
  }

  const upstream = await fetch(source.url, {
    redirect: "follow",
    headers: { "User-Agent": "RevolutionPOS-SetupProxy/1.0" },
  });
  if (!upstream.ok || !upstream.body) {
    const err = new Error(`Setup upstream ${upstream.status}`);
    err.code = "SETUP_UPSTREAM";
    err.status = upstream.status;
    throw err;
  }
  const len = upstream.headers.get("content-length");
  if (len) res.set("Content-Length", len);
  Readable.fromWeb(upstream.body).pipe(res);
  return true;
}

function buildSameOriginDownloadPath(query) {
  const qs = new URLSearchParams();
  qs.set("dl", "1");
  const plan = String(query.plan || "").trim();
  const token = String(query.t || query.token || "").trim();
  if (plan) qs.set("plan", plan);
  if (token) qs.set("t", token);
  return `/api/public/setup-download?${qs.toString()}`;
}

module.exports = {
  SETUP_FILENAME,
  resolveSetupSource,
  streamSetupInstaller,
  buildSameOriginDownloadPath,
  localSetupPath,
};
