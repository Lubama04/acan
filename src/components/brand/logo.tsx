import Image from "next/image";

/** Horizontal logo. The SVG is served as a static file (not through the image optimiser). */
export function Logo({ variant = "color", className }: { variant?: "color" | "white"; className?: string }) {
  return (
    <Image
      src={variant === "white" ? "/brand/logo-white.svg" : "/brand/logo-horizontal.svg"}
      alt="Africa Média, agence de communication"
      width={205}
      height={48}
      unoptimized
      priority={variant === "color"}
      className={className}
    />
  );
}
