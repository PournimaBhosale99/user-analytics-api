const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../db/pool");
const env = require("../config/env");

// Register a new user, assign USER role
async function registerUser({ email, password }) {
  // hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // create user row
  let user;
  try {
    const userRes = await pool.query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, created_at`,
      [email, passwordHash]
    );
    user = userRes.rows[0];
  } catch (err) {
    // 23505 = unique_violation (email already exists)
    if (err.code === "23505") {
      const error = new Error("Email already in use");
      error.code = "EMAIL_TAKEN";
      throw error;
    }
    throw err;
  }

  // find USER role id
  const roleRes = await pool.query(
    `SELECT id FROM roles WHERE name = 'USER'`
  );
  const roleId = roleRes.rows[0].id;

  // map user to USER role (ignore if already there)
  await pool.query(
    `INSERT INTO user_roles (user_id, role_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [user.id, roleId]
  );

  return {
    id: user.id,
    email: user.email,
    createdAt: user.created_at,
  };
}

// Login, verify password, issue JWT, log login event
async function loginUser({ email, password, ip }) {
  // find user by email
  const res = await pool.query(
    `SELECT id, email, password_hash
     FROM users
     WHERE email = $1`,
    [email]
  );

  const user = res.rows[0];
  if (!user) {
    return null; // caller will turn this into 401
  }

  // compare passwords
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return null;
  }

  // fetch roles
  const rolesRes = await pool.query(
    `SELECT r.name
     FROM roles r
     JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = $1`,
    [user.id]
  );
  const roles = rolesRes.rows.map((r) => r.name);

  // create JWT
  const payload = {
    sub: user.id,
    email: user.email,
    roles,
  };

  const token = jwt.sign(payload, env.jwtSecret, {
    expiresIn: "15m",
  });

  // record login event for analytics
  await pool.query(
    `INSERT INTO login_events (user_id, ip_address)
     VALUES ($1, $2)`,
    [user.id, ip || null]
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      roles,
    },
  };
}

module.exports = {
  registerUser,
  loginUser,
};
