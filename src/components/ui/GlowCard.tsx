"use client";
import type { ReactNode, CSSProperties, HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLElement> & { children: ReactNode; className?: string; style?: CSSProperties; as?: "div" | "section" | "article" | "li" } & { [k: `data-${string}`]: string | boolean | undefined };

export function GlowCard({ children, className = "", style, as: Tag = "div", ...rest }: Props) {
  return (
    <Tag
      {...rest}
      className={`glow-card ${className}`}
      style={style}
      onPointerMove={(e: React.PointerEvent<HTMLElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </Tag>
  );
}