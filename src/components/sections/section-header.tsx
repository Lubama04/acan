import type { ReactNode } from "react";

export function SectionHeader({
  eyebrow,
  title,
  lede,
  as: Tag = "h2",
  id,
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  as?: "h1" | "h2";
  id?: string;
  className?: string;
}) {
  return (
    <div className={`max-w-3xl ${className}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <Tag id={id} className={`${Tag === "h1" ? "h1" : "h2"} mt-2 text-navy`}>
        {title}
      </Tag>
      {lede && <p className="lede mt-4">{lede}</p>}
    </div>
  );
}
