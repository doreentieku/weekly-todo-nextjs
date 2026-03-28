"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [darkMode, setDarkMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    setDarkMode(savedTheme === "dark");
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  async function handleLogin(event) {
    event.preventDefault();

    if (!supabase) {
      setMessage("Supabase is not configured.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="app-shell auth-shell">
      <div className="app auth-app">
        <div className="auth-topbar">
          <div>
            <div className="brand-small">Weekly planner</div>
            <h1 className="brand-title">TO-DO</h1>
          </div>

          <button
            className="theme-btn"
            onClick={() => setDarkMode((prev) => !prev)}
            aria-label="Toggle theme"
            type="button"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>

        <section className="panel auth-card">
          <div className="page-tag">Welcome back</div>
          <h2 className="page-title auth-title">SIGN IN</h2>
          <p className="page-subtitle auth-subtitle">
            Sign in to access your weekly planner and manage your todos.
          </p>

          <form onSubmit={handleLogin} className="auth-form">
            <div className="auth-field">
              <label htmlFor="email" className="auth-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="todo-input auth-input"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password" className="auth-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="todo-input auth-input"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="action-btn primary auth-submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {message ? (
            <div className="panel auth-message">
              {message}
            </div>
          ) : null}

          <p className="auth-footer">
            Don’t have an account?{" "}
            <Link href="/signup" className="auth-link">
              Create one
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}