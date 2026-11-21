"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function OrgNav({ slug, items }: { slug: string; items: { href: string; label: string }[] }) {
  const path = usePathname();
  const isOn = (h: string) => (h === "" ? path === `/o/${slug}` : path.startsWith(`/o/${slug}/${h}`));
  return (
    <>
      <nav className="pillnav" aria-label="Navigasi utama">
        {items.map((i) => <Link key={i.href} href={`/o/${slug}${i.href ? "/" + i.href : ""}`} className={isOn(i.href) ? "on" : ""}>{i.label}</Link>)}
      </nav>
      <nav className="bottomnav" aria-label="Navigasi bawah">
        {items.map((i) => <Link key={i.href} href={`/o/${slug}${i.href ? "/" + i.href : ""}`} className={isOn(i.href) ? "on" : ""}>{i.label}</Link>)}
      </nav>
    </>
  );
}
