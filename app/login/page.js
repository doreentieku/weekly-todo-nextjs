"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

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
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px" }}>
      <form
        onSubmit={handleLogin}
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "24px",
          border: "1px solid rgba(0,0,0,0.1)",
          borderRadius: "20px"
        }}
      >
        <h1>Sign In</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginTop: "12px", padding: "12px" }}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", marginTop: "12px", padding: "12px" }}
          required
        />

        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", marginTop: "16px", padding: "12px" }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p style={{ marginTop: "12px" }}>
          Need an account? <a href="/signup">Sign up</a>
        </p>

        {message ? <p style={{ marginTop: "12px" }}>{message}</p> : null}
      </form>
    </main>
  );
}