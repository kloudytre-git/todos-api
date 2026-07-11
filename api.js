const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("VITE_API_URL is not set — check your .env file and restart the dev server.");
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

export const api = {
  listTodos: () => request("/todos"),

  createTodo: (title) =>
    request("/todos", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),

  updateTodo: (todoId, updates) =>
    request(`/todos/${todoId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    }),

  deleteTodo: (todoId) =>
    request(`/todos/${todoId}`, {
      method: "DELETE",
    }),
};