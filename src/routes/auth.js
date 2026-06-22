const express = require("express");
const { signToken, authRequired, authOwner } = require("../middleware/auth");
const {
  findUserByEmail,
  verifyUserPassword,
} = require("../services/licenseService");

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
