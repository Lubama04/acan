import type { ReactNode } from "react";
import { PageHero } from "./page-hero";

export function LegalPage({
  title,
  path,
  updated,
  children,
}: {
  title: string;
  path: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <>
      <PageHero
        title={title}
        crumbs={[{ name: title, path }]}
        lede={<span className="text-base">Dernière mise à jour : {updated}</span>}
      />
      <div className="container-site py-12">
        <div className="prose-am">{children}</div>
      </div>
    </>
  );
}
