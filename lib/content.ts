import { cache } from "react";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import type {
  Post,
  ProjectLink,
  ProjectPost,
  RelatedTech,
  TechPost,
} from "./types";

type PostRow = {
  id: number;
  kind: "project" | "tech";
  slug: string;
  category: string | null;
  title: string;
  summary: string;
  body: string;
  published_at: string;
  is_sample: number;
};

type StringRow = { value: string };
type TagRow = { name: string };
type ProjectLinkRow = ProjectLink;
type RelatedTechRow = RelatedTech;

let database: DatabaseSync | undefined;

function getDatabase() {
  if (!database) {
    database = new DatabaseSync(path.join(process.cwd(), "data", "blog.db"), {
      readOnly: true,
    });
  }
  return database;
}

function queryTags(postId: number) {
  return getDatabase()
    .prepare(
      `SELECT tags.name
       FROM tags
       JOIN post_tags ON post_tags.tag_id = tags.id
       WHERE post_tags.post_id = ?
       ORDER BY tags.name`,
    )
    .all(postId)
    .map((row) => (row as TagRow).name);
}

function queryProjectLinks(projectId: number) {
  return getDatabase()
    .prepare(
      `SELECT kind, label, url
       FROM project_links
       WHERE project_id = ?
       ORDER BY sort_order, id`,
    )
    .all(projectId) as ProjectLinkRow[];
}

function queryRelatedTech(projectId: number) {
  return getDatabase()
    .prepare(
      `SELECT tech.slug, tech.category, tech.title, tech.summary, relation.context
       FROM project_tech_links AS relation
       JOIN posts AS tech ON tech.id = relation.tech_post_id
       WHERE relation.project_id = ? AND tech.kind = 'tech'
       ORDER BY relation.sort_order, tech.title`,
    )
    .all(projectId) as RelatedTechRow[];
}

function toPost(row: PostRow): Post {
  const shared = {
    slug: row.slug,
    title: row.title,
    date: row.published_at,
    summary: row.summary,
    source: row.body,
    tags: queryTags(row.id),
    isSample: Boolean(row.is_sample),
  };

  if (row.kind === "tech") {
    return {
      ...shared,
      kind: "tech",
      category: row.category ?? "uncategorized",
    } satisfies TechPost;
  }

  return {
    ...shared,
    kind: "project",
    links: queryProjectLinks(row.id),
    relatedTech: queryRelatedTech(row.id),
  } satisfies ProjectPost;
}

function queryPosts(where = "", parameters: string[] = []) {
  const rows = getDatabase()
    .prepare(
      `SELECT id, kind, slug, category, title, summary, body, published_at, is_sample
       FROM posts
       ${where}
       ORDER BY published_at DESC, sort_order DESC, id DESC`,
    )
    .all(...parameters) as PostRow[];

  return rows.map(toPost);
}

export const getTechCategories = cache(() =>
  (
    getDatabase()
      .prepare(
        `SELECT DISTINCT category AS value
         FROM posts
         WHERE kind = 'tech'
         ORDER BY category`,
      )
      .all() as StringRow[]
  ).map((row) => row.value),
);

export const getTechPosts = cache(() =>
  queryPosts("WHERE kind = 'tech'").filter(
    (post): post is TechPost => post.kind === "tech",
  ),
);

export const getTechPost = cache((category: string, slug: string) =>
  getTechPosts().find(
    (post) => post.category === category && post.slug === slug,
  ),
);

export const getTechPostsByCategory = cache((category: string) =>
  getTechPosts().filter((post) => post.category === category),
);

export const getTechPostsByTag = cache((tag: string) => {
  const normalized = tag.toLowerCase();
  return getTechPosts().filter((post) => post.tags.includes(normalized));
});

export const getProjectPosts = cache(() =>
  queryPosts("WHERE kind = 'project'").filter(
    (post): post is ProjectPost => post.kind === "project",
  ),
);

export const getProjectPost = cache((slug: string) =>
  getProjectPosts().find((post) => post.slug === slug),
);

export const getAllTags = cache(() =>
  (
    getDatabase()
      .prepare("SELECT name AS value FROM tags ORDER BY name")
      .all() as StringRow[]
  ).map((row) => row.value),
);

export const getRecentTechPosts = cache((limit = 3) =>
  getTechPosts().slice(0, limit),
);

export const getRecentProjectPosts = cache((limit = 3) =>
  getProjectPosts().slice(0, limit),
);
