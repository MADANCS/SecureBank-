-- ============================================================
-- SecureBank: V3 - New Feature Tables
-- Adds: 2FA tokens, KYC documents, nominees,
--       account closure requests, notification preferences,
--       plus optimistic locking + soft-delete columns
-- ============================================================

-- ── Add version (optimistic locking) + soft delete to accounts ─
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS version       BIGINT NOT NULL DEFAULT 0;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS deleted_at    TIMESTAMP;

-- ── Add transaction_pin to users ──────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS transaction_pin  VARCHAR(255);

-- ── Two-Factor Authentication Tokens ─────────────────────────
CREATE TABLE IF NOT EXISTS two_factor_tokens (
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(255) NOT NULL,
    token       VARCHAR(50)  NOT NULL UNIQUE,
    expires_at  TIMESTAMP    NOT NULL,
    used        BOOLEAN      NOT NULL DEFAULT FALSE,
    purpose     VARCHAR(50)  NOT NULL DEFAULT 'LOGIN',
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_2fa_username ON two_factor_tokens(username);
CREATE INDEX IF NOT EXISTS idx_2fa_token    ON two_factor_tokens(token);
CREATE INDEX IF NOT EXISTS idx_2fa_expires  ON two_factor_tokens(expires_at);

-- ── KYC Documents ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kyc_documents (
    id                  BIGSERIAL PRIMARY KEY,
    username            VARCHAR(255) NOT NULL,
    document_type       VARCHAR(50)  NOT NULL,
    file_name           VARCHAR(500) NOT NULL,
    file_path           VARCHAR(1000) NOT NULL,
    content_type        VARCHAR(100) NOT NULL,
    file_size           BIGINT       NOT NULL,
    verification_status VARCHAR(50)  NOT NULL DEFAULT 'PENDING',
    rejection_reason    VARCHAR(500),
    verified_by         VARCHAR(255),
    verified_at         TIMESTAMP,
    uploaded_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at          TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kyc_username ON kyc_documents(username);
CREATE INDEX IF NOT EXISTS idx_kyc_status   ON kyc_documents(verification_status);

-- ── Nominees ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nominees (
    id               BIGSERIAL PRIMARY KEY,
    account_number   VARCHAR(255) NOT NULL,
    nominee_name     VARCHAR(255) NOT NULL,
    relationship     VARCHAR(100) NOT NULL,
    date_of_birth    VARCHAR(20)  NOT NULL,
    phone            VARCHAR(20)  NOT NULL,
    email            VARCHAR(255),
    share_percentage INTEGER      NOT NULL DEFAULT 100,
    created_by       VARCHAR(255) NOT NULL,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP,
    deleted_at       TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_nominee_account ON nominees(account_number);

-- ── Account Closure Requests ──────────────────────────────────
CREATE TABLE IF NOT EXISTS account_closure_requests (
    id             BIGSERIAL PRIMARY KEY,
    account_number VARCHAR(255) NOT NULL,
    requested_by   VARCHAR(255) NOT NULL,
    reason         TEXT         NOT NULL,
    status         VARCHAR(50)  NOT NULL DEFAULT 'PENDING',
    reviewed_by    VARCHAR(255),
    reviewed_at    TIMESTAMP,
    review_note    TEXT,
    requested_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_closure_account  ON account_closure_requests(account_number);
CREATE INDEX IF NOT EXISTS idx_closure_username ON account_closure_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_closure_status   ON account_closure_requests(status);

-- ── Notification Preferences ──────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_preferences (
    id                          BIGSERIAL PRIMARY KEY,
    username                    VARCHAR(255)  NOT NULL UNIQUE,
    email_on_login              BOOLEAN       NOT NULL DEFAULT TRUE,
    sms_on_login                BOOLEAN       NOT NULL DEFAULT FALSE,
    email_on_large_transaction  BOOLEAN       NOT NULL DEFAULT TRUE,
    sms_on_large_transaction    BOOLEAN       NOT NULL DEFAULT TRUE,
    large_transaction_threshold DECIMAL(19,2) NOT NULL DEFAULT 10000.00,
    low_balance_alert           BOOLEAN       NOT NULL DEFAULT TRUE,
    low_balance_threshold       DECIMAL(19,2) NOT NULL DEFAULT 1000.00,
    in_app_notifications        BOOLEAN       NOT NULL DEFAULT TRUE,
    email_on_account_freeze     BOOLEAN       NOT NULL DEFAULT TRUE
);
