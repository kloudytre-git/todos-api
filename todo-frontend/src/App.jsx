import { useState, useEffect } from "react";
import { api } from "./api";
import TodoForm from "./components/TodoForm";
import TodoList from "./components/TodoList";
import "./App.css";

export default function App() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .listTodos()
      .then(setTodos)
      .catch(() => setError("Couldn't load your todos."))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(title) {
    const newTodo = await api.createTodo(title);
    setTodos((current) => [...current, newTodo]);
  }

  async function handleToggle(todo) {
    const updated = await api.updateTodo(todo.todoId, {
      title: todo.title,
      completed: !todo.completed,
    });
    setTodos((current) =>
      current.map((t) => (t.todoId === todo.todoId ? updated : t))
    );
  }

  async function handleDelete(todoId) {
    await api.deleteTodo(todoId);
    setTodos((current) => current.filter((t) => t.todoId !== todoId));
  }

  if (loading) return <p className="status">Loading…</p>;
  if (error) return <p className="status">{error}</p>;

  return (
    <main className="app">
      <h1>Todos</h1>
      <TodoForm onCreate={handleCreate} />
      <TodoList
        todos={todos}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />
    </main>
  );
}