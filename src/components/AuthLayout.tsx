"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);

  const isLoginPage =
    pathname === "/login" || pathname.startsWith("/auth");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email ?? null);
      }
    };
    getUser();
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Don't show nav on login/auth pages
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Minimal top bar */}
      <header className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 h-12 flex items-center justify-between">
          <Link
            href="/"
            className="text-xs text-text-secondary/50 tracking-widest hover:text-text-secondary/80 transition-colors"
          >
            Minamo
          </Link>
          <nav className="flex items-center gap-5">
            <Link
              href="/"
              className="text-xs text-text-secondary/40 hover:text-text-secondary/70 transition-colors"
            >
              書く
            </Link>
            <Link
              href="/timeline"
              className="text-xs text-text-secondary/40 hover:text-text-secondary/70 transition-colors"
            >
              タイムライン
            </Link>
            {email && (
              <span className="text-[10px] text-text-secondary/30">
                {email.length > 20
                  ? email.slice(0, 20) + "..."
                  : email}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-[10px] text-text-secondary/30 hover:text-text-secondary/60 transition-colors"
            >
              ログアウト
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </>
  );
}
