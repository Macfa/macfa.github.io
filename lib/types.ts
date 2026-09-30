export type PostKind = "study" | "project";

export type PostFrontmatter = {
  title: string;
  date: string;
  summary: string;
  tags: string[];
};

export type StudyPost = PostFrontmatter & {
  kind: "study";
  slug: string;
  category: string;
  source: string;
};

export type ProjectPost = PostFrontmatter & {
  kind: "project";
  slug: string;
  source: string;
};

export type Post = StudyPost | ProjectPost;
