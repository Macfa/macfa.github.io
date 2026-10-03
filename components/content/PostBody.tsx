import { MDXRemote } from "next-mdx-remote/rsc";
import type { ComponentPropsWithoutRef } from "react";
import { mdxOptions } from "@/lib/mdx";
import { MdxPre } from "@/components/md/MdxPre";
import { Prose } from "@/components/md/Prose";

const mdxComponents = {
  a: ({ href, ...props }: ComponentPropsWithoutRef<"a">) => {
    const external = href?.startsWith("http://") || href?.startsWith("https://");
    return (
      <a
        {...props}
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        className="text-foreground underline decoration-neutral-400 underline-offset-4 hover:decoration-foreground"
      />
    );
  },
  img: ({ alt = "", ...props }: ComponentPropsWithoutRef<"img">) => (
    // Markdown content can point to local media today and a CDN later.
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={alt} loading="lazy" decoding="async" />
  ),
  pre: MdxPre,
};

export function PostBody({ source }: { source: string }) {
  return (
    <Prose>
      <MDXRemote
        source={source}
        components={mdxComponents}
        options={{ mdxOptions }}
      />
    </Prose>
  );
}
