"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

const ROUTES_WITHOUT_HEADER = ["/login"];

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (ROUTES_WITHOUT_HEADER.includes(pathname)) {
    return <div className="flex min-h-screen flex-col">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 w-full overflow-y-auto">{children}</main>
    </div>
  );
}
