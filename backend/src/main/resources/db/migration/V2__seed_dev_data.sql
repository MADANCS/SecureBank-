-- ============================================================
-- SecureBank: V2 - Seed Data for Development
-- Creates test users with hashed passwords and bank accounts.
-- Passwords are BCrypt hashes of "Test@1234"
-- ============================================================

-- Test user: testuser / Test@1234
INSERT INTO users (username, password, email, role, kyc_status, active)
VALUES (
    'testuser',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- BCrypt: Test@1234
    'testuser@securebank.in',
    'ROLE_USER',
    'APPROVED',
    TRUE
)
ON CONFLICT (username) DO NOTHING;

-- Test user: recipient / Test@1234
INSERT INTO users (username, password, email, role, kyc_status, active)
VALUES (
    'recipient',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- BCrypt: Test@1234
    'recipient@securebank.in',
    'ROLE_USER',
    'APPROVED',
    TRUE
)
ON CONFLICT (username) DO NOTHING;

-- Admin user: admin / Test@1234
INSERT INTO users (username, password, email, role, kyc_status, active)
VALUES (
    'admin',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- BCrypt: Test@1234
    'admin@securebank.in',
    'ROLE_ADMIN',
    'APPROVED',
    TRUE
)
ON CONFLICT (username) DO NOTHING;

-- Savings account for testuser (₹5,00,000 opening balance)
INSERT INTO accounts (account_number, account_type, balance, active, owner_id)
SELECT 'KAR-SAV-TEST-001', 'SAVINGS', 500000.00, TRUE, id
FROM users WHERE username = 'testuser'
ON CONFLICT (account_number) DO NOTHING;

-- Current account for testuser (₹1,50,000 opening balance)
INSERT INTO accounts (account_number, account_type, balance, active, owner_id)
SELECT 'KAR-CUR-TEST-001', 'CURRENT', 150000.00, TRUE, id
FROM users WHERE username = 'testuser'
ON CONFLICT (account_number) DO NOTHING;

-- Savings account for recipient (₹10,000 opening balance)
INSERT INTO accounts (account_number, account_type, balance, active, owner_id)
SELECT 'KAR-SAV-RECP-001', 'SAVINGS', 10000.00, TRUE, id
FROM users WHERE username = 'recipient'
ON CONFLICT (account_number) DO NOTHING;

-- Default spending limits for testuser
INSERT INTO spending_limits (username, daily_limit, weekly_limit, enabled)
VALUES ('testuser', 100000.00, 500000.00, TRUE)
ON CONFLICT (username) DO NOTHING;

INSERT INTO spending_limits (username, daily_limit, weekly_limit, enabled)
VALUES ('recipient', 50000.00, 200000.00, TRUE)
ON CONFLICT (username) DO NOTHING;
