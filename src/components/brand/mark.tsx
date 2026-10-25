/** Decorative brand mark (bubble + Africa + signal arcs), drawn large. Hidden from assistive tech. */
export function BrandMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/mark.svg" alt="" aria-hidden="true" width={64} height={64} className={className} />
  );
}
