"use client";

import { useEffect, useMemo, useState } from "react";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const STORAGE_KEY = "weekly-todo-nextjs-data";
const THEME_KEY = "weekly-todo-nextjs-theme";

function emptyTodos() {
  return DAYS.reduce((acc, day) => {
    acc[day] = [];
    return acc;
  }, {});
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
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

  useEffect(() => {
    setMounted(true);

    try {
      const storedTodos = localStorage.getItem(STORAGE_KEY);
      if (storedTodos) {
        const parsed = JSON.parse(storedTodos);
        setTodosByDay(
          DAYS.reduce((acc, day) => {
            acc[day] = Array.isArray(parsed?.[day]) ? parsed[day] : [];
            return acc;
          }, {})
        );
      }

      const storedTheme = localStorage.getItem(THEME_KEY);
      setDarkMode(storedTheme === "dark");
    } catch {
      setTodosByDay(emptyTodos());
      setDarkMode(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todosByDay));
  }, [mounted, todosByDay]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(THEME_KEY, darkMode ? "dark" : "light");
  }, [mounted, darkMode]);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

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

  function addTodo(day) {
    const text = drafts[day].trim();
    if (!text) return;

    setTodosByDay((prev) => ({
      ...prev,
      [day]: [...prev[day], { id: uid(), text, completed: false }],
    }));

    setDrafts((prev) => ({
      ...prev,
      [day]: "",
    }));
  }

  function toggleTodo(day, id) {
    setTodosByDay((prev) => ({
      ...prev,
      [day]: prev[day].map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ),
    }));
  }

  function deleteTodo(day, id) {
    setTodosByDay((prev) => ({
      ...prev,
      [day]: prev[day].filter((todo) => todo.id !== id),
    }));
  }

  function clearCompleted(day) {
    setTodosByDay((prev) => ({
      ...prev,
      [day]: prev[day].filter((todo) => !todo.completed),
    }));
  }

  return (
    <main className="app-shell">
      <div className="app">
        <nav className="panel navbar">
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
                  Pick a day on the left, type your task, and save it. This version is built for Next.js and saves
                  data in local storage.
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
                      if (event.key === "Enter") addTodo(selectedDay);
                    }}
                  />
                  <button className="action-btn primary" onClick={() => addTodo(selectedDay)}>
                    Add Task
                  </button>
                </div>

                <div className="todo-list">
                  {todosByDay[selectedDay]?.length ? (
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

                  <button className="action-btn" onClick={() => clearCompleted(selectedDay)}>
                    Clear Completed
                  </button>
                </div>

                <div className="todo-list">
                  {todosByDay[selectedDay]?.length ? (
                    todosByDay[selectedDay].map((todo) => (
                      <div
                        className="todo-item clickable"
                        key={todo.id}
                        onClick={() => toggleTodo(selectedDay, todo.id)}
                      >
                        <div className="todo-item-left">
                          <button
                            className={`todo-check ${todo.completed ? "completed" : ""}`}
                            aria-label="Toggle task completion"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleTodo(selectedDay, todo.id);
                            }}
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
