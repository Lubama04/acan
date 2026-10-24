"use client";

import Link from "next/link";

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="container-site py-24">
      <p className="eyebrow">Erreur</p>
      <h1 className="h1 text-navy mt-2">Un problème est survenu</h1>
      <p className="lede mt-4 max-w-2xl">
        La page n&apos;a pas pu s&apos;afficher. Réessayez dans un instant ; si le problème continue,
        écrivez-nous.
      </p>
      {error.digest && <p className="text-slate mt-2 text-sm">Référence : {error.digest}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" onClick={reset}>
          Réessayer
        </button>
        <Link href="/contact" className="btn btn-secondary">
          Nous écrire
        </Link>
      </div>
    </section>
  );
}
