const router = require("express").Router();
const { requireAuth } = require("../middlewares/auth.middleware");

router.get("/me", requireAuth, (req, res) => {
  // req.user was set by requireAuth
  res.json({ user: req.user });
});

module.exports = router;
