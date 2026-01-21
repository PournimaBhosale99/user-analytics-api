const { z } = require("zod");
const { registerUser, loginUser } = require("../services/auth.service");

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function register(req, res, next) {
  try {
    const body = registerSchema.parse(req.body);
    const user = await registerUser(body);
    return res.status(201).json({ user });
  } catch (err) {
    // handle known errors
    if (err.code === "EMAIL_TAKEN") {
      return res.status(409).json({ error: "Email already in use" });
    }
    if (err.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: err.issues });
    }
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const body = loginSchema.parse(req.body);

    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
      req.socket.remoteAddress;

    const result = await loginUser({ ...body, ip });

    if (!result) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    return res.json(result);
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: err.issues });
    }
    return next(err);
  }
}

module.exports = {
  register,
  login,
};
