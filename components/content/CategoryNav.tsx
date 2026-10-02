import Link from "next/link";
import { formatCategory } from "@/lib/site";

export function CategoryNav({
  categories,
  active,
}: {
  categories: string[];
  active?: string;
}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const isActive = active === category;
        return (
          <li key={category}>
            <Link
              href={`/tech/${category}`}
              className={
                isActive
                  ? "rounded border border-foreground px-2 py-1 font-mono text-xs"
                  : "rounded border border-neutral-300 px-2 py-1 font-mono text-xs text-neutral-600 hover:border-foreground hover:text-foreground dark:border-neutral-700 dark:text-neutral-400"
              }
            >
              {formatCategory(category)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
