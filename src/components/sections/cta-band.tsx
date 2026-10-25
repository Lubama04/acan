import Link from "next/link";

export function CtaBand({
  title = "Parlons de votre prochain projet de communication",
  text = "Décrivez votre besoin en quelques minutes. Nous revenons vers vous avec des questions précises, puis une proposition écrite.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="bg-navy text-white" aria-labelledby="cta-title">
      <div className="container-site flex flex-col gap-6 py-14 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <h2 id="cta-title" className="h2">
            {title}
          </h2>
          <p className="text-mist mt-3 text-lg">{text}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/devis" className="btn bg-gold-light text-navy hover:bg-white">
            Demander un devis
          </Link>
          <Link href="/contact" className="btn btn-on-dark">
            Nous écrire
          </Link>
        </div>
      </div>
    </section>
  );
}
