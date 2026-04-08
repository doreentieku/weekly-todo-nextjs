"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "../components/TopNav";
import { supabase } from "../../lib/supabase";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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

export default function AddPage() {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [drafts, setDrafts] = useState(() =>
    DAYS.reduce((acc, day) => {
      acc[day] = "";
      return acc;
    }, {})
  );
  const [todosByDay, setTodosByDay] = useState(emptyTodos);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

      if (!user) router.replace("/login");
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase?.auth?.onAuthStateChange?.((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setAuthLoading(false);
      if (!nextUser) {
        setTodosByDay(emptyTodos());
        router.replace("/login");
      }
    }) ?? { data: { subscription: null } };

    return () => subscription?.unsubscribe?.();
  }, [router]);

  useEffect(() => {
    async function loadTodos() {
      if (!supabase || !user?.id) return;
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("todos")
        .select("id, user_id, day, text, completed, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        setErrorMessage(error.message || "Failed to load todos.");
        setLoading(false);
        return;
      }

      setTodosByDay(groupTodos(data));
      setLoading(false);
    }

    if (user?.id) loadTodos();
  }, [user]);

  const selectedStats = useMemo(() => {
    const items = todosByDay[selectedDay] || [];
    const done = items.filter((t) => t.completed).length;
    return { total: items.length, done };
  }, [selectedDay, todosByDay]);

  async function refreshTodos(currentUserId = user?.id) {
    if (!supabase || !currentUserId) return;
    const { data, error } = await supabase
      .from("todos")
      .select("id, user_id, day, text, completed, created_at")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: true });
    if (error) {
      setErrorMessage(error.message || "Failed to refresh todos.");
      return;
    }
    setTodosByDay(groupTodos(data));
  }

  async function addTodo(day) {
    const text = drafts[day].trim();
    if (!text || !supabase || !user) return;
    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase.from("todos").insert({
      user_id: user.id,
      day,
      text,
      completed: false,
    });

    if (error) {
      setErrorMessage(error.message || "Failed to add todo.");
      setSaving(false);
      return;
    }

    setDrafts((prev) => ({ ...prev, [day]: "" }));
    await refreshTodos(user.id);
    setSaving(false);
  }

  async function deleteTodo(day, id) {
    if (!supabase || !user) return;
    setSaving(true);
    setErrorMessage("");
    const { error } = await supabase.from("todos").delete().eq("id", id).eq("user_id", user.id);
    if (error) {
      setErrorMessage(error.message || "Failed to delete todo.");
      setSaving(false);
      return;
    }
    await refreshTodos(user.id);
    setSaving(false);
  }

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

        <section className="panel cozy-focus">
          <div className="cozy-focus-top">
            <div>
              <div className="page-tag">Add</div>
              <div className="cozy-focus-title">
                <span className="cozy-focus-day">{selectedDay}</span>
                <span className="cozy-focus-count">
                  {selectedStats.total ? (
                    <>
                      {selectedStats.done}/{selectedStats.total} done
                    </>
                  ) : (
                    <>No tasks yet</>
                  )}
                </span>
              </div>
              <div className="cozy-focus-subtitle">Write one tiny task you’ll be proud of.</div>
            </div>

            <div className="cozy-days" aria-label="Select a day">
              {DAYS.map((day) => {
                const active = selectedDay === day;
                const total = (todosByDay[day] || []).length;
                return (
                  <button
                    key={day}
                    className={`cozy-day-chip ${active ? "active" : ""}`}
                    onClick={() => setSelectedDay(day)}
                    type="button"
                    aria-pressed={active}
                  >
                    <span className="cozy-day-chip-name">{day.slice(0, 3)}</span>
                    <span className="cozy-day-chip-count">{total}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="input-row">
            <input
              className="todo-input"
              type="text"
              placeholder={`What would make ${selectedDay} feel easier?`}
              value={drafts[selectedDay]}
              onChange={(event) =>
                setDrafts((prev) => ({
                  ...prev,
                  [selectedDay]: event.target.value,
                }))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter" && !saving) addTodo(selectedDay);
              }}
              disabled={saving || loading}
            />

            <button
              className="action-btn primary"
              onClick={() => addTodo(selectedDay)}
              disabled={saving || loading}
              type="button"
            >
              {saving ? "Saving..." : "Add"}
            </button>
          </div>

          <div className="todo-list">
            {loading ? (
              <div className="empty">
                <strong>Loading...</strong>
                Pulling your tasks from Supabase.
              </div>
            ) : todosByDay[selectedDay]?.length ? (
              todosByDay[selectedDay].map((todo) => (
                <div className="todo-item" key={todo.id}>
                  <div className="todo-item-left">
                    <div>
                      <div className="todo-text">{todo.text}</div>
                      <div className="todo-day">{selectedDay}</div>
                    </div>
                  </div>

                  <button
                    className="delete-btn"
                    onClick={() => deleteTodo(selectedDay, todo.id)}
                    aria-label="Delete task"
                    disabled={saving}
                    type="button"
                  >
                    🗑
                  </button>
                </div>
              ))
            ) : (
              <div className="empty">
                <strong>Nothing here yet</strong>
                Add one small task and make it real.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

