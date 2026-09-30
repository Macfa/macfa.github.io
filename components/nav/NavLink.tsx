"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const normalized = pathname.replace(/\/$/, "") || "/";
  const target = href.replace(/\/$/, "") || "/";
  const active =
    target === "/"
      ? normalized === "/"
      : normalized === target || normalized.startsWith(`${target}/`);

  return (
    <Link
      href={href}
      className={
        active
          ? "text-foreground font-medium"
          : "text-neutral-500 hover:text-foreground"
      }
    >
      {children}
    </Link>
  );
}
