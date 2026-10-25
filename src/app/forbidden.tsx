import Link from "next/link";

export default function Forbidden() {
  return (
    <main className="container-site py-24">
      <p className="eyebrow">Erreur 403</p>
      <h1 className="h1 text-navy mt-2">Accès refusé</h1>
      <p className="lede mt-4">Votre compte n&apos;a pas les droits nécessaires pour cette page.</p>
      <Link href="/" className="btn btn-primary mt-8">
        Retour au site
      </Link>
    </main>
  );
}
