import type { MDXRemoteProps } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import type { Pluggable } from "unified";

export const mdxOptions: NonNullable<MDXRemoteProps["options"]>["mdxOptions"] =
  {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      [
        rehypePrettyCode,
        {
          theme: "github-dark",
          keepBackground: true,
        },
      ] as Pluggable,
    ],
  };
