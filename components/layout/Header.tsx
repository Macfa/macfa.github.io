"use client";

import { useState } from "react";
import Link from "next/link";
import { navItems, site } from "@/lib/site";
import { NavLink } from "@/components/nav/NavLink";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="font-mono text-sm tracking-tight">
          {site.name}
        </Link>
        <nav className="hidden items-center gap-6 text-sm sm:flex">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          className="text-sm text-neutral-500 sm:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open ? (
        <nav
          id="mobile-nav"
          className="flex flex-col gap-3 border-t border-neutral-200 px-4 py-3 text-sm sm:hidden dark:border-neutral-800"
        >
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
