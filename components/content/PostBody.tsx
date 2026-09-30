import { MDXRemote } from "next-mdx-remote/rsc";
import type { ComponentPropsWithoutRef } from "react";
import { mdxOptions } from "@/lib/mdx";
import { Prose } from "@/components/md/Prose";

const mdxComponents = {
  a: (props: ComponentPropsWithoutRef<"a">) => (
    <a
      {...props}
      className="text-foreground underline decoration-neutral-400 underline-offset-4 hover:decoration-foreground"
    />
  ),
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
