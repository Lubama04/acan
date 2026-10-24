import type { ReactNode } from "react";
import { Breadcrumbs } from "./breadcrumbs";

export function PageHero({
  eyebrow,
  title,
  lede,
  crumbs,
  children,
}: {
  eyebrow?: string;
  title: string;
  lede?: ReactNode;
  crumbs: { name: string; path: string }[];
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-border bg-paper">
      <div className="container-site py-10 md:py-14">
        <Breadcrumbs items={crumbs} />
        {eyebrow && <p className="eyebrow mt-6">{eyebrow}</p>}
        <h1 className="h1 mt-2 max-w-3xl text-navy">{title}</h1>
        {lede && <p className="lede mt-4 max-w-3xl">{lede}</p>}
        {children}
      </div>
    </section>
  );
}
