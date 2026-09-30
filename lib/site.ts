export const site = {
  name: "Macfa",
  description: "임베디드와 시스템 프로그래밍 학습 기록",
  repoName: "macfa-blog",
};

export const navItems = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/study", label: "Study" },
  { href: "/about", label: "About" },
] as const;

export const categoryLabels: Record<string, string> = {
  c: "C",
  mcu: "MCU",
  communication: "Communication",
  linux: "Linux",
};

export function formatCategory(slug: string) {
  return categoryLabels[slug] ?? slug.replace(/-/g, " ");
}
