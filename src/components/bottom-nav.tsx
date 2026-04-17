"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAV_ITEMS } from "@/lib/navigation";

export const BottomNav = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t border-line bg-surface px-3 py-2">
      <ul className="grid grid-cols-4 gap-2">
        {APP_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block rounded-xl px-2 py-2 text-center text-xs font-semibold transition ${
                  isActive
                    ? "bg-brand text-white"
                    : "bg-brand-soft/40 text-foreground"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

