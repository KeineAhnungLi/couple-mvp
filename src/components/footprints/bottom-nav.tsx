"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookHeartIcon,
  CalendarIcon,
  FootprintIcon,
  PlusIcon,
  UserIcon,
} from "@/components/footprints/icons";

const items = [
  { href: "/footprints", label: "足迹", icon: FootprintIcon, match: (p: string) => p === "/footprints" || p.startsWith("/footprints/map") },
  { href: "/footprints/calendar", label: "日历", icon: CalendarIcon, match: (p: string) => p.startsWith("/footprints/calendar") },
  { href: "/footprints/new", label: "记一页", icon: PlusIcon, central: true, match: (p: string) => p.startsWith("/footprints/new") },
  { href: "/footprints/memories", label: "回忆", icon: BookHeartIcon, match: (p: string) => p.startsWith("/footprints/memories") },
  { href: "/footprints/profile", label: "我的", icon: UserIcon, match: (p: string) => p.startsWith("/footprints/profile") },
];

export function FootprintBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fp-bottom-nav" aria-label="足迹手账主导航">
      {items.map((item) => {
        const active = item.match(pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`fp-nav-item ${active ? "is-active" : ""} ${item.central ? "is-central" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="fp-nav-icon"><Icon size={item.central ? 30 : 25} /></span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
