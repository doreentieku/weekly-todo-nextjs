"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSignup(e) {
    e.preventDefault();

    if (!supabase) {
      setMessage("Supabase is not configured.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Check your email to confirm your account, then sign in.");
    setLoading(false);
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px" }}>
      <form
        onSubmit={handleSignup}
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "24px",
          border: "1px solid rgba(0,0,0,0.1)",
          borderRadius: "20px"
        }}
      >
        <h1>Sign Up</h1>

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
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p style={{ marginTop: "12px" }}>
          Already have an account? <a href="/login">Sign in</a>
        </p>

        {message ? <p style={{ marginTop: "12px" }}>{message}</p> : null}
      </form>
    </main>
  );
}