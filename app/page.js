"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

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

export default function HomePage() {
  const router = useRouter();

  const [page, setPage] = useState("add");
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [darkMode, setDarkMode] = useState(false);
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
    const savedTheme = localStorage.getItem("theme");
    setDarkMode(savedTheme === "dark");
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

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

      if (!user) {
        router.push("/login");
        setAuthLoading(false);
        return;
      }

      setUser(user);
      setAuthLoading(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;

      if (!nextUser) {
        router.push("/login");
      }

      setUser(nextUser);
    });

    return () => subscription.unsubscribe();
  }, [router]);

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

    if (user?.id) {
      loadTodos();
    }
  }, [user]);

  const totalTodos = useMemo(() => {
    return Object.values(todosByDay).flat().length;
  }, [todosByDay]);

  const totalCompleted = useMemo(() => {
    return Object.values(todosByDay).flat().filter((todo) => todo.completed).length;
  }, [todosByDay]);

  function dayStats(day) {
    const items = todosByDay[day] || [];
    const done = items.filter((item) => item.completed).length;
    return { total: items.length, done };
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

    setDrafts((prev) => ({
      ...prev,
      [day]: "",
    }));

    await refreshTodos(user.id);
    setSaving(false);
  }

  async function toggleTodo(day, id, completed) {
    if (!supabase || !user) return;

    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("todos")
      .update({ completed: !completed })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      setErrorMessage(error.message || "Failed to update todo.");
      setSaving(false);
      return;
    }

    await refreshTodos(user.id);
    setSaving(false);
  }

  async function deleteTodo(day, id) {
    if (!supabase || !user) return;

    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("todos")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      setErrorMessage(error.message || "Failed to delete todo.");
      setSaving(false);
      return;
    }

    await refreshTodos(user.id);
    setSaving(false);
  }

  async function clearCompleted(day) {
    if (!supabase || !user) return;

    const completedIds = (todosByDay[day] || [])
      .filter((todo) => todo.completed)
      .map((todo) => todo.id);

    if (!completedIds.length) return;

    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("todos")
      .delete()
      .in("id", completedIds)
      .eq("user_id", user.id);

    if (error) {
      setErrorMessage(error.message || "Failed to clear completed todos.");
      setSaving(false);
      return;
    }

    await refreshTodos(user.id);
    setSaving(false);
  }

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
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

  return (
    <main className="app-shell">
      <div className="app">
        <nav className="panel navbar">
          <button className="nav-btn" onClick={handleSignOut}>
            Sign Out
          </button>

          <div>
            <div className="brand-small">Weekly planner</div>
            <h1 className="brand-title">TO-DO</h1>
          </div>

          <div className="nav-actions">
            <button
              className={`nav-btn ${page === "add" ? "active" : ""}`}
              onClick={() => setPage("add")}
            >
              Add Todos
            </button>

            <button
              className={`nav-btn ${page === "check" ? "active" : ""}`}
              onClick={() => setPage("check")}
            >
              Check Todos
            </button>

            <button
              className="theme-btn"
              onClick={() => setDarkMode((prev) => !prev)}
              aria-label="Toggle theme"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </nav>

        {errorMessage && (
          <div className="panel" style={{ padding: "16px 18px", marginBottom: "18px" }}>
            {errorMessage}
          </div>
        )}

        <section className="stats">
          <div className="panel stat-card">
            <div className="stat-icon">📅</div>
            <div>
              <div className="stat-label">Selected day</div>
              <div className="stat-value">{selectedDay}</div>
            </div>
          </div>

          <div className="panel stat-card">
            <div className="stat-icon">📝</div>
            <div>
              <div className="stat-label">Total tasks</div>
              <div className="stat-value">{totalTodos}</div>
            </div>
          </div>

          <div className="panel stat-card">
            <div className="stat-icon">✔</div>
            <div>
              <div className="stat-label">Completed</div>
              <div className="stat-value">{totalCompleted}</div>
            </div>
          </div>
        </section>

        <section className="main-grid">
          <aside className="panel sidebar">
            {DAYS.map((day) => {
              const stats = dayStats(day);
              const active = selectedDay === day;

              return (
                <button
                  key={day}
                  className={`day-btn ${active ? "active" : ""}`}
                  onClick={() => setSelectedDay(day)}
                >
                  <div>
                    <div className="day-name">{day.toUpperCase()}</div>
                    <div className="day-meta">
                      {stats.done} of {stats.total} completed
                    </div>
                  </div>
                  <div className="day-count">{stats.total}</div>
                </button>
              );
            })}
          </aside>

          <section className="panel content">
            {page === "add" ? (
              <>
                <div className="page-tag">Page one</div>
                <h2 className="page-title">ADD TODOS</h2>
                <p className="page-subtitle">
                  Pick a day on the left, type your task, and save it in Supabase.
                </p>

                <div className="input-row">
                  <input
                    className="todo-input"
                    type="text"
                    placeholder={`Add a to-do for ${selectedDay}...`}
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
                  >
                    {saving ? "Saving..." : "Add Task"}
                  </button>
                </div>

                <div className="todo-list">
                  {loading ? (
                    <div className="empty">
                      <strong>Loading todos...</strong>
                      Waiting for Supabase data.
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
                        >
                          🗑
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="empty">
                      <strong>No tasks yet for {selectedDay}</strong>
                      Add your first task for this day.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="page-header-row">
                  <div>
                    <div className="page-tag">Page two</div>
                    <h2 className="page-title">CHECK TODOS</h2>
                    <p className="page-subtitle">
                      Click a day, then check off what you finished.
                    </p>
                  </div>

                  <button
                    className="action-btn"
                    onClick={() => clearCompleted(selectedDay)}
                    disabled={saving || loading}
                  >
                    Clear Completed
                  </button>
                </div>

                <div className="todo-list">
                  {loading ? (
                    <div className="empty">
                      <strong>Loading todos...</strong>
                      Waiting for Supabase data.
                    </div>
                  ) : todosByDay[selectedDay]?.length ? (
                    todosByDay[selectedDay].map((todo) => (
                      <div
                        className="todo-item clickable"
                        key={todo.id}
                        onClick={() => toggleTodo(selectedDay, todo.id, todo.completed)}
                      >
                        <div className="todo-item-left">
                          <button
                            className={`todo-check ${todo.completed ? "completed" : ""}`}
                            aria-label="Toggle task completion"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleTodo(selectedDay, todo.id, todo.completed);
                            }}
                            disabled={saving}
                          >
                            {todo.completed ? "✔" : ""}
                          </button>

                          <div>
                            <div className={`todo-text ${todo.completed ? "completed" : ""}`}>
                              {todo.text}
                            </div>
                            <div className="todo-day">{selectedDay}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty">
                      <strong>No tasks available for {selectedDay}</strong>
                      Go to Add Todos and create some first.
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}