import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const writerRoot = join(root, "writer");
const contentRoot = join(root, "content");
const mediaRoot = join(root, "public", "media");
const syncScript = join(root, "scripts", "sync-content.mjs");
const port = Number(process.env.BLOG_EDITOR_PORT ?? 4310);
const host = "127.0.0.1";
const maxBodyBytes = 15 * 1024 * 1024;

function listMarkdownFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = join(directory, entry.name);
    if (entry.isDirectory()) return listMarkdownFiles(target);
    return entry.isFile() && /\.mdx?$/.test(entry.name) ? [target] : [];
  });
}

function locationFromPath(filePath) {
  const parts = relative(contentRoot, filePath).split(sep);
  const kind = parts[0] === "projects" ? "project" : "tech";
  return {
    kind,
    category: kind === "tech" ? parts.at(-2) : null,
    slug: basename(filePath, extname(filePath)),
  };
}

function readCatalog() {
  const posts = listMarkdownFiles(contentRoot).map((filePath) => {
    const parsed = matter(readFileSync(filePath, "utf8"));
    const location = locationFromPath(filePath);
    return {
      ...location,
      title: typeof parsed.data.title === "string" ? parsed.data.title : location.slug,
      summary: typeof parsed.data.summary === "string" ? parsed.data.summary : "",
      tags: Array.isArray(parsed.data.tags) ? parsed.data.tags : [],
      file: relative(root, filePath),
    };
  });
  posts.sort((a, b) => a.title.localeCompare(b.title, "ko"));
  const counts = new Map();
  for (const post of posts) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  const tags = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { posts, tags };
}

function isSafeSegment(value) {
  return typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function resolvePostPath({ kind, category, slug }) {
  if (!isSafeSegment(slug)) throw new Error("slug 형식이 올바르지 않습니다.");
  if (kind === "project") return join(contentRoot, "projects", `${slug}.md`);
  if (kind === "tech" && isSafeSegment(category)) {
    return join(contentRoot, "tech", category, `${slug}.md`);
  }
  throw new Error("글 종류 또는 카테고리가 올바르지 않습니다.");
}

function readPost(searchParams) {
  const location = {
    kind: searchParams.get("kind"),
    category: searchParams.get("category"),
    slug: searchParams.get("slug"),
  };
  const filePath = resolvePostPath(location);
  if (!existsSync(filePath)) throw new Error("글을 찾을 수 없습니다.");
  const parsed = matter(readFileSync(filePath, "utf8"));
  return {
    ...location,
    title: parsed.data.title ?? "",
    date: parsed.data.date ?? "",
    summary: parsed.data.summary ?? "",
    tags: parsed.data.tags ?? [],
    sample: parsed.data.sample === true,
    links: parsed.data.links ?? [],
    relatedTech: parsed.data.relatedTech ?? [],
    body: parsed.content.trim(),
    original: relative(root, filePath),
  };
}

function normalizePost(payload) {
  const kind = payload.kind;
  const category = kind === "tech" ? String(payload.category ?? "").trim().toLowerCase() : null;
  const slug = String(payload.slug ?? "").trim().toLowerCase();
  const title = String(payload.title ?? "").trim();
  const date = String(payload.date ?? "").trim();
  if (!title) throw new Error("제목을 입력해 주세요.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("날짜는 YYYY-MM-DD 형식이어야 합니다.");
  const filePath = resolvePostPath({ kind, category, slug });
  const originalPath = payload.original ? resolve(root, String(payload.original)) : null;
  if (originalPath && originalPath !== filePath) {
    throw new Error("기존 글의 종류·카테고리·slug 변경은 아직 지원하지 않습니다.");
  }
  const tags = [...new Set((Array.isArray(payload.tags) ? payload.tags : []).map((tag) => String(tag).trim().toLowerCase()).filter(Boolean))];
  const data = {
    title,
    date,
    summary: String(payload.summary ?? "").trim(),
    tags,
    sample: payload.sample === true,
  };
  if (kind === "project") {
    data.links = Array.isArray(payload.links) ? payload.links : [];
    data.relatedTech = Array.isArray(payload.relatedTech) ? payload.relatedTech : [];
  }
  return { filePath, data, body: String(payload.body ?? "").trim() };
}

function savePost(payload) {
  const { filePath, data, body } = normalizePost(payload);
  const previous = existsSync(filePath) ? readFileSync(filePath) : null;
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, matter.stringify(`${body}\n`, data), "utf8");
  try {
    const output = execFileSync(process.execPath, [syncScript], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    });
    return { ok: true, file: relative(root, filePath), message: output.trim() };
  } catch (error) {
    if (previous) writeFileSync(filePath, previous);
    else rmSync(filePath, { force: true });
    throw new Error(error.stderr?.toString().trim() || error.message);
  }
}

function saveMedia(payload) {
  const slug = String(payload.slug ?? "").trim().toLowerCase();
  if (!isSafeSegment(slug)) throw new Error("이미지를 넣기 전에 slug를 입력해 주세요.");
  const originalName = basename(String(payload.name ?? "media"));
  const extension = extname(originalName).toLowerCase();
  if (!new Set([".avif", ".gif", ".jpeg", ".jpg", ".mp4", ".png", ".webm", ".webp"]).has(extension)) {
    throw new Error("지원하지 않는 미디어 형식입니다.");
  }
  const match = String(payload.data ?? "").match(/^data:[^;]+;base64,(.+)$/);
  if (!match) throw new Error("미디어 데이터가 올바르지 않습니다.");
  const buffer = Buffer.from(match[1], "base64");
  if (buffer.length > 10 * 1024 * 1024) throw new Error("파일은 10MB 이하여야 합니다.");
  const safeBase = basename(originalName, extension)
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "media";
  const directory = join(mediaRoot, slug);
  mkdirSync(directory, { recursive: true });
  let filename = `${safeBase}${extension}`;
  let suffix = 2;
  while (existsSync(join(directory, filename))) filename = `${safeBase}-${suffix++}${extension}`;
  writeFileSync(join(directory, filename), buffer);
  return { url: `/media/${slug}/${filename}`, bytes: buffer.length };
}

function readJson(request) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBodyBytes) {
        reject(new Error("요청 크기가 너무 큽니다."));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      try {
        resolveBody(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        reject(new Error("JSON 요청이 올바르지 않습니다."));
      }
    });
    request.on("error", reject);
  });
}

function respondJson(response, status, value) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(value));
}

function serveStatic(response, pathname) {
  const files = {
    "/": ["index.html", "text/html; charset=utf-8"],
    "/app.js": ["app.js", "text/javascript; charset=utf-8"],
    "/style.css": ["style.css", "text/css; charset=utf-8"],
  };
  const item = files[pathname];
  if (!item) return false;
  response.writeHead(200, { "Content-Type": item[1], "Cache-Control": "no-store" });
  response.end(readFileSync(join(writerRoot, item[0])));
  return true;
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${host}:${port}`);
  try {
    if (request.method === "GET" && url.pathname === "/api/catalog") {
      return respondJson(response, 200, readCatalog());
    }
    if (request.method === "GET" && url.pathname === "/api/post") {
      return respondJson(response, 200, readPost(url.searchParams));
    }
    if (request.method === "POST" && url.pathname === "/api/post") {
      return respondJson(response, 200, savePost(await readJson(request)));
    }
    if (request.method === "POST" && url.pathname === "/api/media") {
      return respondJson(response, 200, saveMedia(await readJson(request)));
    }
    if (request.method === "GET" && serveStatic(response, url.pathname)) return;
    respondJson(response, 404, { error: "Not found" });
  } catch (error) {
    respondJson(response, 400, { error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(port, host, () => {
  console.log(`Macfa writer: http://${host}:${port}`);
  console.log("Ctrl+C로 종료합니다.");
});
