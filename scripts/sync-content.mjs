import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import matter from "gray-matter";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contentRoot = join(root, "content");
const attachmentsRoot = join(contentRoot, "attachments");
const publicRoot = join(root, "public");
const publicAttachmentsRoot = join(publicRoot, "media", "attachments");
const databasePath = join(root, "data", "blog.db");
const temporaryDatabasePath = join(root, "data", "blog.next.db");
const schemaPath = join(root, "data", "schema.sql");
const projectLinkKinds = ["demo", "repository", "documentation", "download"];
const projectLinkLabels = {
  demo: "Live demo",
  repository: "Repository",
  documentation: "Documentation",
  download: "Download",
};
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

function listFiles(directory, predicate) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = join(directory, entry.name);
    if (entry.isDirectory()) return listFiles(target, predicate);
    return entry.isFile() && predicate(entry.name) ? [target] : [];
  });
}

function listMarkdownFiles(directory) {
  return listFiles(directory, (name) => /\.mdx?$/.test(name));
}

function stringValue(value, filePath, field, required = true) {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value !== "string" || (required && !value.trim())) {
    fail(filePath, `${field} must be a${required ? " non-empty" : ""} string`);
  }
  return value.trim();
}

function parseStringList(value, filePath, field) {
  if (value === undefined) return [];
  const values = Array.isArray(value) ? value : [value];
  return [...new Set(values.map((item) => stringValue(item, filePath, field)))];
}

function parseTags(value, filePath) {
  return parseStringList(value, filePath, "tag").map((tag) =>
    tag.replace(/^#+/, "").trim().toLowerCase(),
  );
}

function validatePublicUrl(url, filePath, field) {
  if (!/^https?:\/\//.test(url) && !url.startsWith("/")) {
    fail(filePath, `${field} must be http(s) or an absolute site path`);
  }
}

function parseProjectLinks(data, filePath, sample) {
  const links = projectLinkKinds.flatMap((kind) => {
    const value = data[kind];
    if (value === undefined || value === null || value === "") return [];
    const url = stringValue(value, filePath, kind);
    validatePublicUrl(url, filePath, kind);
    return [{ kind, label: projectLinkLabels[kind], url }];
  });
  if (!sample && links.length === 0) {
    fail(filePath, "a published project requires demo, repository, documentation, or download");
  }
  return links;
}

function readPosts() {
  const files = [
    ...listMarkdownFiles(join(contentRoot, "projects")),
    ...listMarkdownFiles(join(contentRoot, "tech")),
  ];
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
      vaultPath: relative(contentRoot, filePath).replace(/\.mdx?$/, "").split(sep).join("/"),
      kind,
      slug,
      category,
      title: stringValue(parsed.data.title, filePath, "title"),
      aliases: parseStringList(parsed.data.aliases, filePath, "alias"),
      date: stringValue(parsed.data.date, filePath, "date"),
      summary: typeof parsed.data.summary === "string" ? parsed.data.summary.trim() : "",
      tags: parseTags(parsed.data.tags ?? [], filePath),
      sample,
      links: kind === "project" ? parseProjectLinks(parsed.data, filePath, sample) : [],
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

function normalizeLookupKey(value) {
  return value.normalize("NFKC").replace(/\\/g, "/").replace(/^\.\//, "").replace(/\.mdx?$/i, "").trim().toLowerCase();
}

function addLookup(index, key, value) {
  const normalized = normalizeLookupKey(key);
  if (!normalized) return;
  const matches = index.get(normalized) ?? [];
  if (!matches.includes(value)) matches.push(value);
  index.set(normalized, matches);
}

function buildPostIndex(posts) {
  const index = new Map();
  for (const post of posts) {
    addLookup(index, post.vaultPath, post);
    addLookup(index, post.slug, post);
    addLookup(index, post.title, post);
    for (const alias of post.aliases) addLookup(index, alias, post);
  }
  return index;
}

function findPost(target, sourcePost, postIndex) {
  if (target.includes("#") || target.includes("^")) {
    fail(sourcePost.filePath, `heading and block links are not supported yet: ${target}`);
  }
  const matches = postIndex.get(normalizeLookupKey(target)) ?? [];
  if (matches.length === 0) fail(sourcePost.filePath, `unknown Obsidian link: [[${target}]]`);
  if (matches.length > 1) {
    fail(sourcePost.filePath, `ambiguous Obsidian link; use its vault path: [[${target}]]`);
  }
  return matches[0];
}

function postUrl(post) {
  return post.kind === "tech"
    ? `/tech/${post.category}/${post.slug}`
    : `/projects/${post.slug}`;
}

function resolvePostLinks(post, postIndex) {
  const techReferences = [];
  const rememberTech = (target) => {
    if (post.kind === "project" && target.kind === "tech") {
      const ref = `${target.category}/${target.slug}`;
      if (!techReferences.includes(ref)) techReferences.push(ref);
    }
  };

  let body = post.rawBody.replace(
    /\[\[tech:([a-z0-9-]+\/[a-z0-9-]+)\|([^\]\n]+)\]\]/g,
    (_, ref, label) => {
      const target = findPost(`tech/${ref}`, post, postIndex);
      if (target.kind !== "tech") fail(post.filePath, `not a Tech post: ${ref}`);
      rememberTech(target);
      return `[${label}](${postUrl(target)})`;
    },
  );

  body = body.replace(/(?<!!)\[\[([^\]\n]+)\]\]/g, (_, value) => {
    const separator = value.indexOf("|");
    const targetText = separator === -1 ? value : value.slice(0, separator);
    const label = separator === -1 ? "" : value.slice(separator + 1).trim();
    const target = findPost(targetText.trim(), post, postIndex);
    rememberTech(target);
    return `[${label || target.title}](${postUrl(target)})`;
  });

  if (body.includes("[[")) fail(post.filePath, "invalid or unsupported Obsidian link syntax");
  return { body, techReferences };
}

function buildAttachmentIndex() {
  const index = new Map();
  for (const filePath of listFiles(attachmentsRoot, (name) => allowedMediaExtensions.has(extname(name).toLowerCase()))) {
    const attachment = {
      filePath,
      relativePath: relative(attachmentsRoot, filePath).split(sep).join("/"),
    };
    addLookup(index, attachment.relativePath, attachment);
    addLookup(index, basename(filePath), attachment);
  }
  return index;
}

function findAttachment(target, post, attachmentIndex) {
  const matches = attachmentIndex.get(normalizeLookupKey(target)) ?? [];
  if (matches.length === 0) fail(post.filePath, `attachment not found: ![[${target}]]`);
  if (matches.length > 1) fail(post.filePath, `ambiguous attachment; include its folder: ![[${target}]]`);
  return matches[0];
}

function publicAttachmentUrl(relativePath) {
  return `/media/attachments/${relativePath.split("/").map(encodeURIComponent).join("/")}`;
}

function resolveObsidianEmbeds(post, attachmentIndex) {
  const assets = [];
  const body = post.rawBody.replace(/!\[\[([^\]\n]+)\]\]/g, (_, value) => {
    const separator = value.indexOf("|");
    const targetText = (separator === -1 ? value : value.slice(0, separator)).trim();
    const attachment = findAttachment(targetText, post, attachmentIndex);
    const extension = extname(attachment.relativePath).toLowerCase();
    const kind = allowedMediaExtensions.get(extension);
    const altText = (separator === -1 ? basename(targetText, extension) : value.slice(separator + 1)).trim();
    const outputPath = join(publicAttachmentsRoot, ...attachment.relativePath.split("/"));
    mkdirSync(dirname(outputPath), { recursive: true });
    copyFileSync(attachment.filePath, outputPath);
    const publicUrl = publicAttachmentUrl(attachment.relativePath);
    assets.push({
      storageKey: `media/attachments/${attachment.relativePath}`,
      kind,
      publicUrl,
      altText,
      caption: "",
      byteSize: statSync(attachment.filePath).size,
    });
    return kind === "video"
      ? `<video controls src="${publicUrl}"></video>`
      : `![${altText.replace(/\]/g, "")}](${publicUrl})`;
  });
  return { body, assets };
}

function discoverMarkdownMedia(body, filePath) {
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
      const localPath = join(publicRoot, decodeURIComponent(publicUrl.replace(/^\/+/, "")));
      if (!existsSync(localPath)) fail(filePath, `media file not found: ${publicUrl}`);
      byteSize = statSync(localPath).size;
      storageKey = relative(publicRoot, localPath).split(sep).join("/");
    }
    assets.push({ storageKey, kind, publicUrl, altText, caption, byteSize });
  }
  return assets;
}

const posts = readPosts();
const postIndex = buildPostIndex(posts);
const attachmentIndex = buildAttachmentIndex();
const techByRef = new Map(
  posts.filter((post) => post.kind === "tech").map((post) => [`${post.category}/${post.slug}`, post]),
);
for (const post of posts) {
  const embedded = resolveObsidianEmbeds(post, attachmentIndex);
  post.rawBody = embedded.body;
  const resolved = resolvePostLinks(post, postIndex);
  post.body = resolved.body;
  post.inlineTechReferences = resolved.techReferences;
  post.media = [...new Map(
    [...embedded.assets, ...discoverMarkdownMedia(post.body, post.filePath)].map((asset) => [asset.storageKey, asset]),
  ).values()];
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
  for (const [postIndexValue, post] of posts.entries()) {
    const result = insertPost.run(
      post.kind,
      post.slug,
      post.category,
      post.title,
      post.summary,
      post.body,
      post.date,
      post.sample ? 1 : 0,
      posts.length - postIndexValue,
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
      insertMedia.run(media.storageKey, media.kind, media.publicUrl, media.altText, media.caption, media.byteSize);
      insertPostMedia.run(postId, findMediaRow.get(media.storageKey).id, index);
    }
  }

  for (const post of posts.filter((item) => item.kind === "project")) {
    const projectId = postIds.get(`project::${post.slug}`);
    for (const [index, ref] of post.inlineTechReferences.entries()) {
      const target = techByRef.get(ref);
      const techId = postIds.get(`tech:${target.category}:${target.slug}`);
      insertProjectTech.run(projectId, techId, target.summary, index);
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
  `Synced ${posts.length} Obsidian Markdown posts (${posts.filter((post) => post.kind === "project").length} projects, ${techByRef.size} Tech) into ${relative(root, databasePath)}`,
);
