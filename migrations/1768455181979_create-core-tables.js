/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // USERS
  pgm.createTable("users", {
    id: "id",
    email: { type: "varchar(255)", notNull: true, unique: true },
    password_hash: { type: "text", notNull: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  // ROLES
  pgm.createTable("roles", {
    id: "id",
    name: { type: "varchar(50)", notNull: true, unique: true },
  });

  // USER_ROLES (many-to-many)
  pgm.createTable("user_roles", {
    user_id: {
      type: "integer",
      notNull: true,
      references: "users(id)",
      onDelete: "CASCADE",
    },
    role_id: {
      type: "integer",
      notNull: true,
      references: "roles(id)",
      onDelete: "CASCADE",
    },
  });

  // composite primary key prevents duplicate role assignment
  pgm.addConstraint("user_roles", "user_roles_pk", {
    primaryKey: ["user_id", "role_id"],
  });

  // LOGIN EVENTS (analytics)
  pgm.createTable("login_events", {
    id: "id",
    user_id: {
      type: "integer",
      notNull: true,
      references: "users(id)",
      onDelete: "CASCADE",
    },
    login_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    ip_address: { type: "varchar(64)" },
  });

  // Indexes for performance
  // - email lookup is hot path for login
  pgm.createIndex("users", "email");
  // - analytics queries often filter by user_id and time range
  pgm.createIndex("login_events", ["user_id", "login_at"]);

  // Seed default roles
  pgm.sql(`INSERT INTO roles (name) VALUES ('USER'), ('ADMIN');`);
};

exports.down = (pgm) => {
  pgm.dropTable("login_events");
  pgm.dropTable("user_roles");
  pgm.dropTable("roles");
  pgm.dropTable("users");
};
