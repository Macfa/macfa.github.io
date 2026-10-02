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

CREATE TABLE project_tech_links (
  project_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tech_post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  context TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, tech_post_id),
  CHECK (project_id <> tech_post_id)
);

CREATE TABLE project_links (
  id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (
    kind IN ('demo', 'repository', 'documentation', 'download')
  ),
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE media_assets (
  id INTEGER PRIMARY KEY,
  storage_key TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('image', 'gif', 'video')),
  public_url TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  width INTEGER,
  height INTEGER,
  byte_size INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE post_media (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  media_id INTEGER NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'inline' CHECK (
    role IN ('cover', 'inline', 'gallery')
  ),
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (post_id, media_id)
);

CREATE TRIGGER validate_project_tech_link
BEFORE INSERT ON project_tech_links
BEGIN
  SELECT CASE
    WHEN (SELECT kind FROM posts WHERE id = NEW.project_id) <> 'project'
      THEN RAISE(ABORT, 'project_id must reference a project')
    WHEN (SELECT kind FROM posts WHERE id = NEW.tech_post_id) <> 'tech'
      THEN RAISE(ABORT, 'tech_post_id must reference a tech post')
  END;
END;

CREATE TRIGGER validate_project_link
BEFORE INSERT ON project_links
BEGIN
  SELECT CASE
    WHEN (SELECT kind FROM posts WHERE id = NEW.project_id) <> 'project'
      THEN RAISE(ABORT, 'project_id must reference a project')
  END;
END;

CREATE INDEX posts_kind_date ON posts (kind, published_at DESC);
CREATE INDEX posts_category_date ON posts (category, published_at DESC);
CREATE INDEX project_tech_by_project
  ON project_tech_links (project_id, sort_order);
CREATE INDEX project_links_by_project
  ON project_links (project_id, sort_order);
CREATE INDEX post_media_by_post ON post_media (post_id, role, sort_order);
