import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-neutral-200 py-6 text-center font-mono text-xs text-neutral-500 dark:border-neutral-800">
      {site.name} · Embedded &amp; Systems Notes
    </footer>
  );
}
