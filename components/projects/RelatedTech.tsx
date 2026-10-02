import Link from "next/link";
import type { RelatedTech as RelatedTechItem } from "@/lib/types";
import { formatCategory } from "@/lib/site";

export function RelatedTech({ posts }: { posts: RelatedTechItem[] }) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 border-t border-neutral-200 pt-8 dark:border-neutral-800">
      <p className="font-mono text-xs text-neutral-500">Continue learning</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">
        이 프로젝트와 연결된 Tech
      </h2>
      <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
        구현을 이해하는 데 필요한 개념을 이어서 살펴볼 수 있습니다.
      </p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {posts.map((post) => (
          <li key={`${post.category}/${post.slug}`}>
            <Link
              href={`/tech/${post.category}/${post.slug}`}
              className="block h-full rounded-lg border border-neutral-200 p-4 transition-colors hover:border-foreground dark:border-neutral-800"
            >
              <p className="font-mono text-[11px] text-neutral-500">
                {formatCategory(post.category)}
              </p>
              <h3 className="mt-1 text-sm font-semibold">{post.title}</h3>
              {post.context ? (
                <p className="mt-2 text-xs leading-5 text-neutral-600 dark:text-neutral-400">
                  {post.context}
                </p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
