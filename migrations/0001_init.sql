-- Phase 1 schema cho app bản đồ (Cloudflare D1). Timestamps = epoch ms (INTEGER).

-- Người dùng
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user',          -- 'user' | 'admin'
  plan TEXT NOT NULL DEFAULT 'trial',          -- 'trial' | 'month' | 'year' | 'none'
  expires_at INTEGER,                          -- hết hạn dùng (epoch ms)
  created_at INTEGER NOT NULL,
  updated_at INTEGER,
  payment_provider TEXT,                       -- tương lai: 'payos' | 'stripe'
  payment_ref TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Phiên đăng nhập (token ngẫu nhiên, có hạn)
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- Đánh giá (Phase 3) — place_id trỏ tới điểm trong KV
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  place_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  rating INTEGER NOT NULL,
  content TEXT NOT NULL,                        -- ràng buộc >=100 ký tự ở tầng app
  photos TEXT,                                  -- JSON mảng URL
  verified_checkin INTEGER NOT NULL DEFAULT 0,  -- 0/1 (đến gần khi đánh giá)
  lat REAL,
  lng REAL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_reviews_place ON reviews(place_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

-- Tour + lịch trình (Phase 2)
CREATE TABLE IF NOT EXISTS tours (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_photo TEXT,
  published INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);
CREATE TABLE IF NOT EXISTS tour_days (
  id TEXT PRIMARY KEY,
  tour_id TEXT NOT NULL,
  day_no INTEGER NOT NULL,
  title TEXT,
  note TEXT
);
CREATE INDEX IF NOT EXISTS idx_tourdays_tour ON tour_days(tour_id);
CREATE TABLE IF NOT EXISTS tour_stops (
  id TEXT PRIMARY KEY,
  day_id TEXT NOT NULL,
  place_id TEXT NOT NULL,
  seq INTEGER NOT NULL DEFAULT 0,
  guide TEXT
);
CREATE INDEX IF NOT EXISTS idx_tourstops_day ON tour_stops(day_id);
