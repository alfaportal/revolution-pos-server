const jwt = require("jsonwebtoken");

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET duhet të jetë të paktën 16 karaktere");
  }
  return secret;
}

function signToken(payload) {
  return jwt.sign(payload, jwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "12h",
  });
}

function verifyToken(token) {
  return jwt.verify(token, jwtSecret());
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const cookie = req.cookies?.rip_token;
  const token = header.startsWith("Bearer ") ? header.slice(7) : cookie;

  if (!token) {
    return res.status(401).json({ gabim: "Kërkohet autentifikim." });
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ gabim: "Sesioni skadoi. Hyni përsëri." });
  }
}

function superAdminOnly(req, res, next) {
  if (req.user?.roli !== "super_admin") {
    return res.status(403).json({ gabim: "Vetëm Super Admin." });
  }
  next();
}

function licenseApiKeyOptional(req, res, next) {
  const required = process.env.LICENSE_API_KEY;
  if (!required) return next();
  const key = req.headers["x-api-key"];
  if (key !== required) {
    return res.status(401).json({ gabim: "API key i pavlefshëm." });
  }
  next();
}

module.exports = {
  signToken,
  verifyToken,
  authRequired,
  superAdminOnly,
  licenseApiKeyOptional,
};
