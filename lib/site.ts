export const site = {
  name: "Macfa",
  description: "임베디드와 시스템 프로그래밍 학습 기록",
  repoName: "macfa-blog",
};

export const navItems = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/tech", label: "Tech" },
  { href: "/about", label: "About" },
] as const;

export const categoryLabels: Record<string, string> = {
  c: "C",
  communication: "Communication",
};

export function formatCategory(slug: string) {
  return categoryLabels[slug] ?? slug.replace(/-/g, " ");
}
