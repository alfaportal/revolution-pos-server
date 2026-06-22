const express = require("express");
const { signToken, authRequired, authOwner } = require("../middleware/auth");
const {
  findUserByEmail,
  verifyUserPassword,
} = require("../services/licenseService");
const {
  validateOwnerInvite,
  completeOwnerSetup,
  getOwnerLoginBranding,
} = require("../services/userService");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ gabim: "Email dhe fjalëkalimi janë të detyrueshëm." });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ gabim: "Kredencialet janë të gabuara." });
    }

    const ok = await verifyUserPassword(user, password);
    if (!ok) {
      return res.status(401).json({ gabim: "Kredencialet janë të gabuara." });
    }

    if (user.roli === "client_admin") {
      return res.status(403).json({
        gabim: "Këto kredenciale nuk kanë akses në këtë hyrje.",
      });
    }
    if (user.roli !== "super_admin") {
      return res.status(401).json({ gabim: "Kredencialet janë të gabuara." });
    }

    const token = signToken({
      sub: user.id,
      email: user.email,
      emri: user.emri,
      roli: user.roli,
      client_id: user.client_id,
    });

    res.cookie("rip_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 12 * 60 * 60 * 1000,
    });

    res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        emri: user.emri,
        email: user.email,
        roli: user.roli,
      },
    });
  } catch (e) {
    res.status(500).json({ gabim: e.message });
  }
});

router.post("/owner/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ gabim: "Email dhe fjalëkalimi janë të detyrueshëm." });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ gabim: "Kredencialet janë të gabuara." });
    }

    if (!user.passwordi) {
      return res.status(403).json({
        gabim: "Llogaria nuk është aktivizuar. Përdorni linkun e ftesës për të vendosur fjalëkalimin.",
        code: "PENDING_SETUP",
      });
    }

    const ok = await verifyUserPassword(user, password);
    if (!ok) {
      return res.status(401).json({ gabim: "Kredencialet janë të gabuara." });
    }

    if (user.roli === "super_admin") {
      return res.status(403).json({ gabim: "Këto kredenciale nuk kanë akses në këtë hyrje." });
    }
    if (user.roli !== "client_admin") {
      return res.status(401).json({ gabim: "Kredencialet janë të gabuara." });
    }
    if (user.aktiv === false) {
      return res.status(403).json({ gabim: "Llogaria është çaktivizuar. Kontaktoni supportin." });
    }
    if (!user.client_id) {
      return res.status(403).json({ gabim: "Llogaria nuk është e lidhur me restorant." });
    }

    const token = signToken({
      sub: user.id,
      email: user.email,
      emri: user.emri,
      roli: user.roli,
      client_id: user.client_id,
    });

    res.cookie("owner_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 12 * 60 * 60 * 1000,
    });

    res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        emri: user.emri,
        email: user.email,
        roli: user.roli,
        client_id: user.client_id,
      },
    });
  } catch (e) {
    res.status(500).json({ gabim: e.message });
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie("rip_token");
  res.json({ ok: true });
});

router.get("/owner/branding", async (req, res) => {
  try {
    const branding = await getOwnerLoginBranding(req.query.email);
    if (!branding.ok) {
      return res.json({ ok: false });
    }
    res.json({ ok: true, ...branding });
  } catch (e) {
    res.status(500).json({ ok: false, gabim: e.message });
  }
});

router.get("/owner/invite/:token", async (req, res) => {
  try {
    const result = await validateOwnerInvite(req.params.token);
    const status = result.valid ? 200 : 400;
    res.status(status).json(result);
  } catch (e) {
    res.status(500).json({ valid: false, gabim: e.message });
  }
});

router.post("/owner/setup", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ ok: false, gabim: "Token dhe fjalëkalimi janë të detyrueshëm." });
    }
    const user = await completeOwnerSetup(token, password);
    res.json({
      ok: true,
      message: "Llogaria u aktivizua. Tani mund të hyni.",
      email: user.email,
    });
  } catch (e) {
    const status = e.code === "NOT_FOUND" || e.code === "EXPIRED" || e.code === "ALREADY_ACTIVE" ? 400 : 500;
    res.status(status).json({ ok: false, gabim: e.message, code: e.code || null });
  }
});

router.post("/owner/logout", (_req, res) => {
  res.clearCookie("owner_token");
  res.json({ ok: true });
});

router.get("/me", authRequired, (req, res) => {
  if (req.user?.roli !== "super_admin") {
    return res.status(403).json({ gabim: "Akses i ndaluar." });
  }
  res.json({ ok: true, user: req.user });
});

router.get("/owner/me", authOwner, (req, res) => {
  res.json({ ok: true, user: req.user });
});

module.exports = router;
