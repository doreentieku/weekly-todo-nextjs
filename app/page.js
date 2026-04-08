"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import TopNav from "./components/TopNav";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function emptyTodos() {
  return DAYS.reduce((acc, day) => {
    acc[day] = [];
    return acc;
  }, {});
}

function groupTodos(rows) {
  const grouped = emptyTodos();

  for (const row of rows || []) {
    if (!grouped[row.day]) continue;

    grouped[row.day].push({
      id: row.id,
      text: row.text,
      completed: row.completed,
      created_at: row.created_at,
    });
  }

  for (const day of DAYS) {
    grouped[day].sort((a, b) => {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }

  return grouped;
}

function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const router = useRouter();

  const [errorMessage, setErrorMessage] = useState("");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

useEffect(() => {
  async function loadUser() {
    if (!supabase) {
      setErrorMessage("Supabase is not configured.");
      setAuthLoading(false);
      return;
    }

    const {
      data: { user },
      } = await supabase.auth.getUser();

      setUser(user ?? null);
      setAuthLoading(false);

      if (!user) {
        router.replace("/login");
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;

      setUser(nextUser);
      setAuthLoading(false);

      if (!nextUser) {
        setTodosByDay(emptyTodos());
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const nameHint = useMemo(() => {
    const email = user?.email || user?.user_metadata?.email;
    if (!email || typeof email !== "string") return "";
    const left = email.split("@")[0] || "";
    const cleaned = left.replace(/[._-]+/g, " ").trim();
    if (!cleaned) return "";
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }, [user]);

  if (authLoading) {
    return (
      <main className="app-shell">
        <div className="app">
          <div className="panel notice">Checking session...</div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="app-shell">
        <div className="app">
          <div className="panel notice">Redirecting...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="app">
        <TopNav />

        {errorMessage && (
          <div className="panel" style={{ padding: "16px 18px", marginBottom: "18px" }}>
            {errorMessage}
          </div>
        )}

        <section className="panel home-hero">
          <div className="page-tag">Home</div>
          <h2 className="home-title">
            {greetingForNow()}
            {nameHint ? `, ${nameHint}` : ""}.
          </h2>
          <p className="home-subtitle">
            This isn’t about doing everything. It’s about doing <strong>one</strong> meaningful thing
            next—then letting that momentum carry you.
          </p>

          <div className="home-actions">
            <Link className="action-btn primary" href="/add">
              Add a task
            </Link>
            <Link className="action-btn" href="/check">
              Check progress
            </Link>
          </div>
        </section>

        <section className="home-grid">
          <div className="panel home-card">
            <div className="home-card-title">Make it small</div>
            <div className="home-card-body">Tiny tasks feel possible. Possible becomes consistent.</div>
            <Link className="home-card-link" href="/add">
              Add something gentle →
            </Link>
          </div>

          <div className="panel home-card">
            <div className="home-card-title">Notice the wins</div>
            <div className="home-card-body">Checking off is a reward loop. Use it on purpose.</div>
            <Link className="home-card-link" href="/check">
              Mark something done →
            </Link>
          </div>

          <div className="panel home-card">
            <div className="home-card-title">Stay in your rhythm</div>
            <div className="home-card-body">
              A calm space reduces friction—so you come back tomorrow.
            </div>
            <Link className="home-card-link" href="/add">
              Start your next step →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}