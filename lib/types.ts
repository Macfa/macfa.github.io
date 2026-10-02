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

export type ProjectLink = {
  kind: "demo" | "repository" | "documentation" | "download";
  label: string;
  url: string;
};

export type RelatedTech = Pick<
  TechPost,
  "slug" | "category" | "title" | "summary"
> & {
  context: string;
};

export type ProjectPost = PostFrontmatter & {
  kind: "project";
  slug: string;
  source: string;
  links: ProjectLink[];
  relatedTech: RelatedTech[];
};

export type Post = TechPost | ProjectPost;
