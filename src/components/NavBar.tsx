"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function NavBar() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);

  const isPublicPage =
    pathname === "/login" || pathname.startsWith("/auth") || pathname === "/";

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmail(user.email ?? null);
    };
    getUser();
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (isPublicPage) return null;

  const linkClass = (active: boolean) =>
    `text-sm transition-colors ${
      active ? "text-[#17171c] font-medium" : "text-[#75758a] hover:text-[#17171c]"
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-[#e5e7eb]">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/app" className="text-sm text-[#17171c] tracking-tight font-medium">
          Minamo
        </Link>
        <nav className="flex items-center gap-8">
          <Link href="/app" className={linkClass(pathname === "/app")}>
            書く
          </Link>
          <Link href="/app/explore" className={linkClass(pathname.startsWith("/app/explore"))}>
            探る
          </Link>
          <Link href="/app/timeline" className={linkClass(pathname.startsWith("/app/timeline"))}>
            タイムライン
          </Link>
          <div className="h-4 w-px bg-[#e5e7eb]" />
          {email && (
            <span className="text-xs text-[#93939f]">{email.length > 24 ? email.slice(0, 24) + "…" : email}</span>
          )}
          <button onClick={handleLogout} className="text-xs text-[#93939f] hover:text-[#17171c] transition-colors">
            ログアウト
          </button>
        </nav>
      </div>
    </header>
  );
}
