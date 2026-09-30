import Link from "next/link";

export function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <li key={tag}>
          <Link
            href={`/study/tags/${tag}`}
            className="rounded border border-neutral-300 px-2 py-0.5 font-mono text-xs text-neutral-600 hover:border-foreground hover:text-foreground dark:border-neutral-700 dark:text-neutral-400"
          >
            {tag}
          </Link>
        </li>
      ))}
    </ul>
  );
}
