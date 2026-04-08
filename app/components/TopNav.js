"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../lib/useTheme";

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { mounted, darkMode, setDarkMode } = useTheme();

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <nav className="topnav">
      <div className="topnav-left">
        <Link href="/" className="topnav-brand" aria-label="Go to home">
          <div className="brand-small">Weekly planner</div>
          <div className="brand-title">TO-DO</div>
        </Link>
      </div>

      <div className="topnav-center" role="navigation" aria-label="Main">
        <Link className={`topnav-link ${pathname === "/" ? "active" : ""}`} href="/">
          Home
        </Link>
        <Link className={`topnav-link ${pathname === "/add" ? "active" : ""}`} href="/add">
          Add
        </Link>
        <Link className={`topnav-link ${pathname === "/check" ? "active" : ""}`} href="/check">
          Check
        </Link>
      </div>

      <div className="topnav-right">
        <button
          className="theme-btn"
          onClick={() => setDarkMode((prev) => !prev)}
          aria-label="Toggle theme"
          type="button"
        >
          {mounted ? (darkMode ? "☀️" : "🌙") : "🌙"}
        </button>
        <button className="nav-btn" onClick={handleSignOut} type="button">
          Sign Out
        </button>
      </div>
    </nav>
  );
}

