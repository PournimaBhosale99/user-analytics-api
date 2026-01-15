const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const logger = require("./utils/logger");
const healthRoutes = require("./routes/health.routes");

const app = express();

/**
 * Security HTTP headers
 * Protects against common vulnerabilities
 */
app.use(helmet());

/**
 * Enable CORS
 * Allows frontend / external clients to call this API
 */
app.use(cors());

/**
 * Rate limiting
 * Prevents abuse and brute-force attacks
 */
app.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 120,          // max 120 requests per IP per minute
    standardHeaders: true,
    legacyHeaders: false,
  })
);

/**
 * Parse JSON request bodies
 * Without this, req.body will be undefined
 */
app.use(express.json({ limit: "1mb" }));

/**
 * Request logging
 * Logs every incoming request
 */
app.use((req, res, next) => {
  logger.info(
    { method: req.method, path: req.path },
    "incoming request"
  );
  next();
});

/**
 * Routes
 */
app.use("/", healthRoutes);

/**
 * 404 handler
 * Runs when no route matches
 */
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

/**
 * Centralized error handler
 * Prevents app crashes
 */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
