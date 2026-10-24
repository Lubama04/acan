import Link from "next/link";

// Fallback for URLs outside every route group (rendered without the site header).
export default function RootNotFound() {
  return (
    <main className="container-site py-24">
      <p className="eyebrow">Erreur 404</p>
      <h1 className="h1 text-navy mt-2">Cette page n&apos;existe pas</h1>
      <Link href="/" className="btn btn-primary mt-8">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
