"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

const ROUTES_WITHOUT_SIDEBAR = ["/", "/login"];

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (ROUTES_WITHOUT_SIDEBAR.includes(pathname)) {
    return <div className="flex min-h-screen flex-col">{children}</div>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
