-- Phase 2: chuyển kho điểm sang D1 + gắn chủ sở hữu & trạng thái duyệt.
CREATE TABLE IF NOT EXISTS places (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  category TEXT NOT NULL DEFAULT 'an',
  description TEXT,
  photos TEXT,                         -- JSON mảng URL
  address TEXT,
  rating REAL,
  owner_id TEXT,                        -- NULL = điểm CHÍNH THỨC (admin); else = user tạo
  status TEXT NOT NULL DEFAULT 'approved',  -- approved | private | pending | rejected
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_places_owner ON places(owner_id);
CREATE INDEX IF NOT EXISTS idx_places_status ON places(status);
