import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewerContext } from "@/lib/auth";
import { FootprintBottomNav } from "@/components/footprints/bottom-nav";
import "./footprints.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL("https://travel.shanjideutsch.site"),
  title: "妈妈的足迹手账",
  description: "把走过的地方、照片和心情慢慢收进一本私人手账。",
  applicationName: "足迹手账",
  alternates: {
    canonical: "/footprints",
  },
  appleWebApp: {
    capable: true,
    title: "足迹手账",
    statusBarStyle: "default",
  },
};

export default async function FootprintsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const context = await getViewerContext();
  if (!context) redirect("/login?next=%2Ffootprints");

  return (
    <div className="fp-root">
      <div className="fp-shell">
        <main className="fp-main">{children}</main>
      </div>
      <FootprintBottomNav />
    </div>
  );
}
