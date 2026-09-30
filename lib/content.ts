import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { PostFrontmatter, ProjectPost, StudyPost } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content");
const STUDY_DIR = path.join(CONTENT_DIR, "study");
const PROJECTS_DIR = path.join(CONTENT_DIR, "projects");

function isMdxFile(name: string) {
  return name.endsWith(".mdx") || name.endsWith(".md");
}

function slugFromFilename(filename: string) {
  return filename.replace(/\.mdx?$/, "");
}

function parseFrontmatter(raw: string, filePath: string): {
  data: PostFrontmatter;
  source: string;
} {
  const { data, content } = matter(raw);
  const title = typeof data.title === "string" ? data.title : "";
  const date = typeof data.date === "string" ? data.date : "";
  const summary = typeof data.summary === "string" ? data.summary : "";
  const tags = Array.isArray(data.tags)
    ? data.tags
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
    : [];

  if (!title || !date) {
    throw new Error(`Invalid frontmatter in ${filePath}: title and date are required`);
  }

  return {
    data: { title, date, summary, tags },
    source: content,
  };
}

function readFile(filePath: string) {
  return fs.readFileSync(filePath, "utf8");
}

function listDir(dir: string) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir, { withFileTypes: true });
}

export function getStudyCategories() {
  return listDir(STUDY_DIR)
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function getStudyPosts(): StudyPost[] {
  const posts: StudyPost[] = [];

  for (const category of getStudyCategories()) {
    const categoryDir = path.join(STUDY_DIR, category);
    for (const entry of listDir(categoryDir)) {
      if (!entry.isFile() || !isMdxFile(entry.name)) {
        continue;
      }
      const filePath = path.join(categoryDir, entry.name);
      const { data, source } = parseFrontmatter(readFile(filePath), filePath);
      posts.push({
        kind: "study",
        slug: slugFromFilename(entry.name),
        category,
        source,
        ...data,
      });
    }
  }

  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

export function getStudyPost(category: string, slug: string) {
  return getStudyPosts().find(
    (post) => post.category === category && post.slug === slug,
  );
}

export function getStudyPostsByCategory(category: string) {
  return getStudyPosts().filter((post) => post.category === category);
}

export function getStudyPostsByTag(tag: string) {
  const normalized = tag.toLowerCase();
  return getStudyPosts().filter((post) => post.tags.includes(normalized));
}

export function getProjectPosts(): ProjectPost[] {
  const posts: ProjectPost[] = [];

  for (const entry of listDir(PROJECTS_DIR)) {
    if (!entry.isFile() || !isMdxFile(entry.name)) {
      continue;
    }
    const filePath = path.join(PROJECTS_DIR, entry.name);
    const { data, source } = parseFrontmatter(readFile(filePath), filePath);
    posts.push({
      kind: "project",
      slug: slugFromFilename(entry.name),
      source,
      ...data,
    });
  }

  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

export function getProjectPost(slug: string) {
  return getProjectPosts().find((post) => post.slug === slug);
}

export function getAllTags() {
  const tags = new Set<string>();
  for (const post of [...getStudyPosts(), ...getProjectPosts()]) {
    for (const tag of post.tags) {
      tags.add(tag);
    }
  }
  return [...tags].sort();
}

export function getRecentStudyPosts(limit = 3) {
  return getStudyPosts().slice(0, limit);
}

export function getRecentProjectPosts(limit = 3) {
  return getProjectPosts().slice(0, limit);
}
