"use client";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletCapsule } from "@/components/wallet/WalletCapsule";
import { IconDemo, IconHeart, IconMe, IconProof, IconWalk } from "./Icons";

const ITEMS = [
  ["Walk", "/walk/new", IconWalk, "Walk"],
  ["My walks", "/me", IconMe, "Mine"],
  ["Heartbeat", "/heartbeat", IconHeart, "Pulse"],
  ["Proof", "/proof", IconProof, "Proof"],
  ["Demo", "/demo", IconDemo, "Demo"],
] as const;

const isActive = (path: string, href: string) => path === href || path.startsWith(href.replace("/new", "") + "/") || (href === "/walk/new" && path.startsWith("/w/"));

export function NavCapsule() {
  const path = usePathname();
  return (
    <>
      <nav aria-label="Main" className="nav-capsule">
        <Link href="/" className="nav-brand" aria-label="Chog Twain home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/mark.svg" alt="" width={30} height={30} />
          <span className="nav-items">Chog Twain</span>
        </Link>
        <span className="nav-links">
          {ITEMS.map(([label, href]) => {
            const active = isActive(path, href);
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined} className="nav-item">
                {active && <motion.span layoutId="nav-active" className="nav-active" transition={{ type: "spring", stiffness: 520, damping: 38 }} />}
                <span className="nav-label">{label}</span>
              </Link>
            );
          })}
        </span>
        <WalletCapsule />
      </nav>
      <nav aria-label="Dock" className="dock">
        {ITEMS.map(([label, href, Icon, short]) => {
          const active = isActive(path, href);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} aria-label={label}>
              {active && <motion.span layoutId="dock-active" className="nav-active" transition={{ type: "spring", stiffness: 520, damping: 38 }} />}
              <Icon /><span className="nav-label">{short}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}