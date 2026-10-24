import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-site py-24">
      <p className="eyebrow">Erreur 404</p>
      <h1 className="h1 mt-2 text-navy">Cette page n&apos;existe pas ou plus</h1>
      <p className="lede mt-4 max-w-2xl">Le lien est peut-être ancien. Voici quelques pages utiles :</p>
      <ul className="mt-6 flex flex-wrap gap-3">
        <li>
          <Link href="/" className="btn btn-primary">
            Accueil
          </Link>
        </li>
        <li>
          <Link href="/services" className="btn btn-secondary">
            Services
          </Link>
        </li>
        <li>
          <Link href="/contact" className="btn btn-secondary">
            Contact
          </Link>
        </li>
      </ul>
    </section>
  );
}
