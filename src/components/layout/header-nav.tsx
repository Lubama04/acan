"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

type Item = { href: string; label: string };

const isCurrent = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

/** Desktop navigation: marks the current section (aria-current + underline). */
export function DesktopNav({ items }: { items: Item[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigation principale" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {items.map((item) => {
          const current = isCurrent(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`text-navy hover:bg-paper inline-flex min-h-11 items-center rounded-md px-3 text-[0.95rem] font-semibold ${
                  current ? "decoration-gold-ink underline decoration-2 underline-offset-8" : ""
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Mobile menu built on <details> (works without JavaScript). Keyed by pathname so it closes
 * after a client-side navigation.
 */
export function MobileNav({ items }: { items: Item[] }) {
  const pathname = usePathname();
  return (
    <details key={pathname} className="group relative lg:hidden">
      <summary
        className="border-border text-navy flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-md border [&::-webkit-details-marker]:hidden"
        aria-label="Ouvrir le menu"
      >
        <Menu aria-hidden="true" className="size-6" />
      </summary>
      <nav
        aria-label="Navigation mobile"
        className="border-border absolute end-0 top-14 z-50 w-72 rounded-lg border bg-white p-2 shadow-lg"
      >
        <ul>
          {items.map((item) => {
            const current = isCurrent(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  className={`text-navy hover:bg-paper block rounded-md px-3 py-3 font-semibold ${current ? "bg-paper" : ""}`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li className="border-border mt-2 border-t pt-2">
            <Link href="/devis" className="btn btn-primary w-full">
              Demander un devis
            </Link>
          </li>
        </ul>
      </nav>
    </details>
  );
}
