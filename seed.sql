-- seed.sql
DROP TABLE IF EXISTS members;

CREATE TABLE members (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,              -- 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'
  age INT NOT NULL,
  score NUMERIC(5,2) NOT NULL,
  joined_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 인덱스 (정렬/검색 대비)
CREATE INDEX idx_members_name ON members (name);
CREATE INDEX idx_members_joined_at ON members (joined_at DESC);
CREATE INDEX idx_members_status ON members (status);

-- 50만건 시드
INSERT INTO members (name, email, status, age, score, joined_at)
SELECT
  'User_' || gs AS name,
  'user' || gs || '@example.com' AS email,
  (ARRAY['ACTIVE','INACTIVE','SUSPENDED','PENDING'])[1 + floor(random()*4)]::text AS status,
  18 + floor(random()*47)::int AS age,
  round((random()*100)::numeric, 2) AS score,
  NOW()
    - (floor(random()*365) || ' days')::interval
    - (floor(random()*86400) || ' seconds')::interval
FROM generate_series(1, 500000) gs;

VACUUM ANALYZE members;
