const { Pool } = require("pg");
const env = require("../config/env");
const logger = require("../utils/logger");

const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
  logger.error({ err }, "Unexpected PG pool error");
});

async function healthcheck() {
  const res = await pool.query("SELECT 1 as ok");
  return res.rows[0].ok === 1;
}

module.exports = { pool, healthcheck };
