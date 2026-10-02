import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import matter from "gray-matter";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contentRoot = join(root, "content");
const publicRoot = join(root, "public");
const databasePath = join(root, "data", "blog.db");
const temporaryDatabasePath = join(root, "data", "blog.next.db");
const schemaPath = join(root, "data", "schema.sql");
const allowedLinkKinds = new Set([
  "demo",
  "repository",
  "documentation",
  "download",
]);
const allowedMediaExtensions = new Map([
  [".avif", "image"],
  [".gif", "gif"],
  [".jpeg", "image"],
  [".jpg", "image"],
  [".mp4", "video"],
  [".png", "image"],
  [".webm", "video"],
  [".webp", "image"],
]);

function fail(filePath, message) {
  throw new Error(`${relative(root, filePath)}: ${message}`);
}

function listMarkdownFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = join(directory, entry.name);
    if (entry.isDirectory()) return listMarkdownFiles(target);
    return entry.isFile() && /\.mdx?$/.test(entry.name) ? [target] : [];
  });
}

function stringValue(value, filePath, field, required = true) {
  if (typeof value !== "string" || (required && !value.trim())) {
    fail(filePath, `${field} must be a${required ? " non-empty" : ""} string`);
  }
  return value.trim();
}

function parseTags(value, filePath) {
  if (!Array.isArray(value)) fail(filePath, "tags must be an array");
  return [...new Set(value.map((tag) => stringValue(tag, filePath, "tag").toLowerCase()))];
}

function parseLinks(value, filePath, sample) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) fail(filePath, "links must be an array");
  const links = value.map((link, index) => {
    if (!link || typeof link !== "object") fail(filePath, `links[${index}] must be an object`);
    const kind = stringValue(link.kind, filePath, `links[${index}].kind`);
    if (!allowedLinkKinds.has(kind)) fail(filePath, `unsupported link kind: ${kind}`);
    const url = stringValue(link.url, filePath, `links[${index}].url`);
    if (!/^https?:\/\//.test(url) && !url.startsWith("/")) {
      fail(filePath, `links[${index}].url must be http(s) or an absolute site path`);
    }
    return {
      kind,
      label: typeof link.label === "string" && link.label.trim() ? link.label.trim() : kind,
      url,
    };
  });
  if (!sample && links.length === 0) {
    fail(filePath, "a published project requires at least one public link");
  }
  return links;
}

function parseRelatedTech(value, filePath) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) fail(filePath, "relatedTech must be an array");
  return value.map((relation, index) => {
    if (!relation || typeof relation !== "object") {
      fail(filePath, `relatedTech[${index}] must be an object`);
    }
    return {
      ref: stringValue(relation.ref, filePath, `relatedTech[${index}].ref`),
      context:
        typeof relation.context === "string" ? relation.context.trim() : "",
    };
  });
}

function readPosts() {
  const files = listMarkdownFiles(contentRoot);
  const posts = files.map((filePath) => {
    const pathParts = relative(contentRoot, filePath).split(sep);
    const topLevel = pathParts[0];
    const kind = topLevel === "projects" ? "project" : topLevel === "tech" ? "tech" : null;
    if (!kind) fail(filePath, "content must live under content/projects or content/tech");

    const category = kind === "tech" ? pathParts.at(-2) : null;
    if (kind === "tech" && pathParts.length !== 3) {
      fail(filePath, "Tech content path must be content/tech/<category>/<slug>.md");
    }
    if (kind === "project" && pathParts.length !== 2) {
      fail(filePath, "Project content path must be content/projects/<slug>.md");
    }

    const slug = basename(filePath, extname(filePath));
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      fail(filePath, "filename slug must use lowercase letters, numbers, and hyphens");
    }

    const parsed = matter(readFileSync(filePath, "utf8"));
    const sample = parsed.data.sample === true;
    return {
      filePath,
      kind,
      slug,
      category,
      title: stringValue(parsed.data.title, filePath, "title"),
      date: stringValue(parsed.data.date, filePath, "date"),
      summary:
        typeof parsed.data.summary === "string" ? parsed.data.summary.trim() : "",
      tags: parseTags(parsed.data.tags ?? [], filePath),
      sample,
      links: kind === "project" ? parseLinks(parsed.data.links, filePath, sample) : [],
      relatedTech:
        kind === "project" ? parseRelatedTech(parsed.data.relatedTech, filePath) : [],
      rawBody: parsed.content.trim(),
    };
  });

  const routeKeys = new Set();
  for (const post of posts) {
    const key = `${post.kind}:${post.category ?? ""}:${post.slug}`;
    if (routeKeys.has(key)) fail(post.filePath, `duplicate content route: ${key}`);
    routeKeys.add(key);
  }
  return posts;
}

function resolveReferences(post, techByRef) {
  const references = [];
  const body = post.rawBody.replace(
    /\[\[tech:([a-z0-9-]+\/[a-z0-9-]+)\|([^\]\n]+)\]\]/g,
    (_, ref, label) => {
      const target = techByRef.get(ref);
      if (!target) fail(post.filePath, `unknown Tech reference: ${ref}`);
      references.push(ref);
      return `[${label}](/tech/${ref})`;
    },
  );
  if (body.includes("[[tech:")) fail(post.filePath, "invalid Tech reference syntax");
  return { body, references };
}

function discoverMedia(body, filePath) {
  const assets = [];
  const pattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g;
  for (const match of body.matchAll(pattern)) {
    const [, altText, publicUrl, caption = ""] = match;
    const extension = extname(publicUrl.split("?")[0]).toLowerCase();
    const kind = allowedMediaExtensions.get(extension);
    if (!kind) fail(filePath, `unsupported media extension in ${publicUrl}`);

    let byteSize = null;
    let storageKey = `remote:${publicUrl}`;
    if (publicUrl.startsWith("/")) {
      const localPath = join(publicRoot, publicUrl.replace(/^\/+/, ""));
      if (!existsSync(localPath)) fail(filePath, `media file not found: ${publicUrl}`);
      byteSize = statSync(localPath).size;
      storageKey = relative(publicRoot, localPath).split(sep).join("/");
    }
    assets.push({ storageKey, kind, publicUrl, altText, caption, byteSize });
  }
  return assets;
}

const posts = readPosts();
const techByRef = new Map(
  posts
    .filter((post) => post.kind === "tech")
    .map((post) => [`${post.category}/${post.slug}`, post]),
);
for (const post of posts) {
  const resolved = resolveReferences(post, techByRef);
  post.body = resolved.body;
  post.inlineTechReferences = resolved.references;
  post.media = discoverMedia(post.body, post.filePath);
  for (const relation of post.relatedTech) {
    if (!techByRef.has(relation.ref)) {
      fail(post.filePath, `unknown relatedTech reference: ${relation.ref}`);
    }
  }
}

mkdirSync(dirname(databasePath), { recursive: true });
rmSync(temporaryDatabasePath, { force: true });
const db = new DatabaseSync(temporaryDatabasePath);
db.exec(readFileSync(schemaPath, "utf8"));

const insertPost = db.prepare(`
  INSERT INTO posts (
    kind, slug, category, title, summary, body, published_at, is_sample, sort_order
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertTag = db.prepare("INSERT OR IGNORE INTO tags (name) VALUES (?)");
const findTag = db.prepare("SELECT id FROM tags WHERE name = ?");
const insertPostTag = db.prepare("INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)");
const insertProjectLink = db.prepare(`
  INSERT INTO project_links (project_id, kind, label, url, sort_order)
  VALUES (?, ?, ?, ?, ?)
`);
const insertProjectTech = db.prepare(`
  INSERT INTO project_tech_links (project_id, tech_post_id, context, sort_order)
  VALUES (?, ?, ?, ?)
`);
const insertMedia = db.prepare(`
  INSERT OR IGNORE INTO media_assets (
    storage_key, kind, public_url, alt_text, caption, byte_size
  ) VALUES (?, ?, ?, ?, ?, ?)
`);
const findMediaRow = db.prepare("SELECT id FROM media_assets WHERE storage_key = ?");
const insertPostMedia = db.prepare(`
  INSERT INTO post_media (post_id, media_id, role, sort_order)
  VALUES (?, ?, 'inline', ?)
`);

const postIds = new Map();
db.exec("BEGIN");
try {
  for (const [postIndex, post] of posts.entries()) {
    const result = insertPost.run(
      post.kind,
      post.slug,
      post.category,
      post.title,
      post.summary,
      post.body,
      post.date,
      post.sample ? 1 : 0,
      posts.length - postIndex,
    );
    const postId = result.lastInsertRowid;
    postIds.set(`${post.kind}:${post.category ?? ""}:${post.slug}`, postId);

    for (const tag of post.tags) {
      insertTag.run(tag);
      insertPostTag.run(postId, findTag.get(tag).id);
    }
    for (const [index, link] of post.links.entries()) {
      insertProjectLink.run(postId, link.kind, link.label, link.url, index);
    }
    for (const [index, media] of post.media.entries()) {
      insertMedia.run(
        media.storageKey,
        media.kind,
        media.publicUrl,
        media.altText,
        media.caption,
        media.byteSize,
      );
      insertPostMedia.run(postId, findMediaRow.get(media.storageKey).id, index);
    }
  }

  for (const post of posts.filter((item) => item.kind === "project")) {
    const projectId = postIds.get(`project::${post.slug}`);
    for (const [index, relation] of post.relatedTech.entries()) {
      const target = techByRef.get(relation.ref);
      const techId = postIds.get(`tech:${target.category}:${target.slug}`);
      insertProjectTech.run(projectId, techId, relation.context, index);
    }
  }
  db.exec("COMMIT");
} catch (error) {
  db.exec("ROLLBACK");
  db.close();
  rmSync(temporaryDatabasePath, { force: true });
  throw error;
}
db.close();
rmSync(databasePath, { force: true });
renameSync(temporaryDatabasePath, databasePath);

console.log(
  `Synced ${posts.length} Markdown posts (${posts.filter((post) => post.kind === "project").length} projects, ${techByRef.size} Tech) into ${relative(root, databasePath)}`,
);
