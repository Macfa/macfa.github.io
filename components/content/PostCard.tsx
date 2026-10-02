import Link from "next/link";
import { formatCategory } from "@/lib/site";
import type { Post } from "@/lib/types";
import { SampleBadge } from "./SampleBadge";
import { TagList } from "./TagList";

function hrefFor(post: Post) {
  if (post.kind === "tech") {
    return `/tech/${post.category}/${post.slug}`;
  }
  return `/projects/${post.slug}`;
}

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="border-b border-neutral-200 py-5 last:border-b-0 dark:border-neutral-800">
      <p className="font-mono text-xs text-neutral-500">
        <time dateTime={post.date}>{post.date}</time>
        {post.kind === "tech" ? (
          <>
            {" · "}
            <Link
              href={`/tech/${post.category}`}
              className="hover:text-foreground"
            >
              {formatCategory(post.category)}
            </Link>
          </>
        ) : (
          " · Project"
        )}
      </p>
      <h2 className="mt-1 text-lg font-semibold tracking-tight">
        <Link href={hrefFor(post)} className="hover:underline">
          {post.title}
        </Link>
      </h2>
      {post.isSample ? (
        <div className="mt-2">
          <SampleBadge />
        </div>
      ) : null}
      {post.summary ? (
        <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
          {post.summary}
        </p>
      ) : null}
      <div className="mt-3">
        <TagList tags={post.tags} />
      </div>
    </article>
  );
}
