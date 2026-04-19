-- Auth.js D1 Adapter 所需的表结构

-- 创建 users 表
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    emailVerified DATETIME,
    image TEXT
);

-- 创建 accounts 表
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    providerAccountId TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建 sessions 表
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    sessionToken TEXT UNIQUE NOT NULL,
    userId TEXT NOT NULL,
    expires DATETIME NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建 verification_tokens 表
CREATE TABLE IF NOT EXISTS verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires DATETIME NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_accounts_userId ON accounts(userId);
CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId);
CREATE INDEX IF NOT EXISTS idx_accounts_provider_providerAccountId ON accounts(provider, providerAccountId);
