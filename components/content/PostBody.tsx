import { MDXRemote } from "next-mdx-remote/rsc";
import { isValidElement, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { mdxOptions } from "@/lib/mdx";
import { MermaidDiagram } from "@/components/md/MermaidDiagram";
import { Prose } from "@/components/md/Prose";

type PrettyCodePreProps = ComponentPropsWithoutRef<"pre"> & {
  "data-language"?: string;
};

function codeBlockText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(codeBlockText).join("");
  }
  if (!isValidElement<{ children?: ReactNode; "data-line"?: boolean }>(node)) {
    return "";
  }

  const text = codeBlockText(node.props.children);
  return node.props["data-line"] !== undefined ? `${text}\n` : text;
}

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
  pre: ({ children, ...props }: PrettyCodePreProps) => {
    if (props["data-language"] === "mermaid") {
      return <MermaidDiagram chart={codeBlockText(children).trim()} />;
    }
    return <pre {...props}>{children}</pre>;
  },
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
