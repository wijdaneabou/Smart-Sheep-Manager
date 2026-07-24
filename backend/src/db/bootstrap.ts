import { pool } from "./connection.js";

export async function ensureAuditAndSessionTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id int AUTO_INCREMENT NOT NULL,
      user_id int NOT NULL,
      refresh_token varchar(500) NOT NULL,
      ip varchar(100),
      user_agent text,
      login_at timestamp NOT NULL DEFAULT (now()),
      logout_at timestamp NULL,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamp NOT NULL DEFAULT (now()),
      CONSTRAINT user_sessions_id PRIMARY KEY (id),
      CONSTRAINT user_sessions_user_id_users_id_fk
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE cascade ON UPDATE no action
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id int AUTO_INCREMENT NOT NULL,
      user_id int,
      module varchar(100) NOT NULL,
      action varchar(100) NOT NULL,
      description text,
      result varchar(20) NOT NULL,
      ip varchar(45),
      user_agent text,
      created_at timestamp DEFAULT (now()),
      CONSTRAINT audit_logs_id PRIMARY KEY (id),
      CONSTRAINT audit_logs_user_id_users_id_fk
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE no action ON UPDATE no action
    )
  `);
}
