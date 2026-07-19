-- ============================================================
-- SecureBank: V1 - Initial Schema
-- Generated to match all JPA entity definitions exactly.
-- Compatible with PostgreSQL 14+
-- ============================================================

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL,
    role        VARCHAR(50)  NOT NULL,
    kyc_status  VARCHAR(50)  NOT NULL DEFAULT 'PENDING',
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Accounts ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
    id             BIGSERIAL PRIMARY KEY,
    account_number VARCHAR(255) UNIQUE NOT NULL,
    account_type   VARCHAR(50)  NOT NULL,
    balance        DECIMAL(19,2) NOT NULL DEFAULT 0.00,
    active         BOOLEAN      NOT NULL DEFAULT TRUE,
    owner_id       BIGINT       NOT NULL,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_account_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_accounts_owner ON accounts(owner_id);

-- ── Transactions (Legacy) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
    id               BIGSERIAL PRIMARY KEY,
    from_account     VARCHAR(255),
    to_account       VARCHAR(255),
    amount           DECIMAL(19,2) NOT NULL,
    status           VARCHAR(50)   NOT NULL,
    idempotency_key  VARCHAR(255)  UNIQUE,
    created_by       VARCHAR(255),
    created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tx_from_status ON transactions(from_account, status, created_at);

-- ── Transactions V2 (Active) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions_v2 (
    id               BIGSERIAL PRIMARY KEY,
    reference_number VARCHAR(255) UNIQUE,
    from_account     VARCHAR(255) NOT NULL,
    to_account       VARCHAR(255) NOT NULL,
    amount           DECIMAL(19,2) NOT NULL,
    status           VARCHAR(50)   NOT NULL DEFAULT 'PENDING',
    category         VARCHAR(50)   NOT NULL,
    description      VARCHAR(500),
    idempotency_key  VARCHAR(255)  UNIQUE,
    created_by       VARCHAR(255)  NOT NULL,
    created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_txv2_from_account ON transactions_v2(from_account);
CREATE INDEX IF NOT EXISTS idx_txv2_to_account   ON transactions_v2(to_account);
CREATE INDEX IF NOT EXISTS idx_txv2_status        ON transactions_v2(status);
CREATE INDEX IF NOT EXISTS idx_txv2_created_at    ON transactions_v2(created_at);
CREATE INDEX IF NOT EXISTS idx_txv2_from_status   ON transactions_v2(from_account, status, created_at);

-- ── Audit Logs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id             BIGSERIAL PRIMARY KEY,
    username       VARCHAR(255),
    action         VARCHAR(255) NOT NULL,
    details        TEXT,
    ip_address     VARCHAR(255),
    user_agent     VARCHAR(500),
    correlation_id VARCHAR(255),
    timestamp      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_username   ON audit_logs(username);
CREATE INDEX IF NOT EXISTS idx_audit_action     ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp  ON audit_logs(timestamp);

-- ── Spending Limits ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS spending_limits (
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(255) UNIQUE NOT NULL,
    daily_limit   DECIMAL(19,2),
    weekly_limit  DECIMAL(19,2),
    enabled       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Account Freeze History ────────────────────────────────────
CREATE TABLE IF NOT EXISTS account_freeze_history (
    id             BIGSERIAL PRIMARY KEY,
    account_number VARCHAR(255) NOT NULL,
    status         VARCHAR(50)  NOT NULL,
    frozen_by      VARCHAR(255) NOT NULL,
    frozen_at      TIMESTAMP,
    unfrozen_at    TIMESTAMP,
    reason         VARCHAR(255),
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Refresh Tokens ────────────────────────────────────────────
-- Entity uses: token (unique), username (string), expires_at (Instant)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          BIGSERIAL PRIMARY KEY,
    token       VARCHAR(512) UNIQUE NOT NULL,
    username    VARCHAR(255)        NOT NULL,
    expires_at  TIMESTAMP           NOT NULL,
    created_at  TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_username ON refresh_tokens(username);

-- ── Recurring Payments ────────────────────────────────────────
-- Entity fields: accountNumber, billType, reference, amount, frequency,
--                nextExecutionAt, enabled, status, lastExecutedAt, lastExecutionStatus
CREATE TABLE IF NOT EXISTS recurring_payments (
    id                    BIGSERIAL PRIMARY KEY,
    account_number        VARCHAR(255)  NOT NULL,
    bill_type             VARCHAR(100)  NOT NULL,
    reference             VARCHAR(255)  NOT NULL,
    amount                DECIMAL(19,2) NOT NULL,
    frequency             VARCHAR(50)   NOT NULL DEFAULT 'MONTHLY',
    next_execution_at     TIMESTAMP     NOT NULL,
    enabled               BOOLEAN       NOT NULL DEFAULT TRUE,
    status                VARCHAR(50)   NOT NULL DEFAULT 'ACTIVE',
    last_executed_at      TIMESTAMP,
    last_execution_status VARCHAR(50),
    created_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recurring_account ON recurring_payments(account_number);
CREATE INDEX IF NOT EXISTS idx_recurring_next_at ON recurring_payments(next_execution_at);

-- ── Payment Orders ────────────────────────────────────────────
-- Entity fields: accountNumber, billType, reference, amount, status,
--                provider, externalId (unique), currency
CREATE TABLE IF NOT EXISTS payment_orders (
    id             BIGSERIAL PRIMARY KEY,
    account_number VARCHAR(255)  NOT NULL,
    bill_type      VARCHAR(100)  NOT NULL,
    reference      VARCHAR(255)  NOT NULL,
    amount         DECIMAL(19,2) NOT NULL,
    status         VARCHAR(50)   NOT NULL DEFAULT 'PENDING',
    provider       VARCHAR(100),
    external_id    VARCHAR(255)  UNIQUE,
    currency       VARCHAR(10)   NOT NULL DEFAULT 'INR',
    created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Loan Applications ─────────────────────────────────────────
-- Entity fields: accountNumber, applicantUsername, loanType, principalAmount,
--                tenureMonths, interestRate, totalPayable, emiAmount, remainingBalance,
--                status, approvedAt, approvedBy, nextEmiAt, lastPaymentAt
CREATE TABLE IF NOT EXISTS loan_applications (
    id                BIGSERIAL PRIMARY KEY,
    account_number    VARCHAR(255)  NOT NULL,
    applicant_username VARCHAR(255) NOT NULL,
    loan_type         VARCHAR(50)   NOT NULL,
    principal_amount  DECIMAL(19,2) NOT NULL,
    tenure_months     INTEGER       NOT NULL,
    interest_rate     DECIMAL(5,2)  NOT NULL,
    total_payable     DECIMAL(19,2),
    emi_amount        DECIMAL(19,2),
    remaining_balance DECIMAL(19,2),
    status            VARCHAR(50)   NOT NULL DEFAULT 'PENDING',
    approved_at       TIMESTAMP,
    approved_by       VARCHAR(255),
    next_emi_at       TIMESTAMP,
    last_payment_at   TIMESTAMP,
    created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loans_applicant ON loan_applications(applicant_username);
CREATE INDEX IF NOT EXISTS idx_loans_status     ON loan_applications(status);
