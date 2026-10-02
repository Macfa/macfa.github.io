import type { ProjectLink } from "@/lib/types";

const kindLabels: Record<ProjectLink["kind"], string> = {
  demo: "Live demo",
  repository: "GitHub",
  documentation: "Documentation",
  download: "Download",
};

export function ProjectLinks({ links }: { links: ProjectLink[] }) {
  if (links.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 border-y border-neutral-200 py-5 dark:border-neutral-800">
      <h2 className="text-sm font-semibold tracking-wide uppercase">
        Project links
      </h2>
      <ul className="mt-3 flex flex-wrap gap-3">
        {links.map((link) => (
          <li key={`${link.kind}:${link.url}`}>
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium transition-colors hover:border-foreground hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
            >
              <span>{link.label || kindLabels[link.kind]}</span>
              <span aria-hidden="true">↗</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
