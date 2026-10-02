export type PostKind = "tech" | "project";

export type PostFrontmatter = {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  isSample: boolean;
};

export type TechPost = PostFrontmatter & {
  kind: "tech";
  slug: string;
  category: string;
  source: string;
};

export type ProjectPost = PostFrontmatter & {
  kind: "project";
  slug: string;
  source: string;
};

export type Post = TechPost | ProjectPost;
