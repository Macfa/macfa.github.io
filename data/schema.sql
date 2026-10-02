PRAGMA foreign_keys = ON;

CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('project', 'tech')),
  slug TEXT NOT NULL,
  category TEXT,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  published_at TEXT NOT NULL,
  is_sample INTEGER NOT NULL DEFAULT 0 CHECK (is_sample IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  CHECK (
    (kind = 'tech' AND category IS NOT NULL) OR
    (kind = 'project' AND category IS NULL)
  )
);

CREATE UNIQUE INDEX posts_route_key
  ON posts (kind, IFNULL(category, ''), slug);

CREATE TABLE tags (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE post_tags (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX posts_kind_date ON posts (kind, published_at DESC);
CREATE INDEX posts_category_date ON posts (category, published_at DESC);
