-- ============================================================
-- SecureBank: V4 - Add Missing AuditModel Columns
-- Adds created_by, updated_by, deleted to all tables that
-- extend AuditModel but were missing these fields.
-- transactions / transactions_v2 already have created_by in V1.
-- ============================================================

-- ── accounts (missing: created_by, updated_by, deleted) ───────
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS created_by  VARCHAR(255) NOT NULL DEFAULT 'system';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS updated_by  VARCHAR(255);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS deleted     BOOLEAN NOT NULL DEFAULT FALSE;

-- ── users (missing: created_by, updated_by, deleted) ──────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by  VARCHAR(255) NOT NULL DEFAULT 'system';
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_by  VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted     BOOLEAN NOT NULL DEFAULT FALSE;

-- ── transactions (missing: updated_by, deleted) ───────────────
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS updated_by  VARCHAR(255);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS deleted     BOOLEAN NOT NULL DEFAULT FALSE;

-- ── transactions_v2 (missing: updated_by, deleted) ────────────
ALTER TABLE transactions_v2 ADD COLUMN IF NOT EXISTS updated_by  VARCHAR(255);
ALTER TABLE transactions_v2 ADD COLUMN IF NOT EXISTS deleted     BOOLEAN NOT NULL DEFAULT FALSE;

-- ── recurring_payments (missing: created_by, updated_by, deleted)
ALTER TABLE recurring_payments ADD COLUMN IF NOT EXISTS created_by  VARCHAR(255) NOT NULL DEFAULT 'system';
ALTER TABLE recurring_payments ADD COLUMN IF NOT EXISTS updated_by  VARCHAR(255);
ALTER TABLE recurring_payments ADD COLUMN IF NOT EXISTS deleted     BOOLEAN NOT NULL DEFAULT FALSE;

-- ── payment_orders (missing: created_by, updated_by, deleted) ─
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS created_by  VARCHAR(255) NOT NULL DEFAULT 'system';
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS updated_by  VARCHAR(255);
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS deleted     BOOLEAN NOT NULL DEFAULT FALSE;

-- ── loan_applications (missing: created_by, updated_by, deleted)
ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS created_by  VARCHAR(255) NOT NULL DEFAULT 'system';
ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS updated_by  VARCHAR(255);
ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS deleted     BOOLEAN NOT NULL DEFAULT FALSE;
