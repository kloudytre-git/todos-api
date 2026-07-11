export default function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <li className="todo-item">
      <label>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo)}
        />
        <span className={todo.completed ? "done" : ""}>{todo.title}</span>
      </label>
      <button onClick={() => onDelete(todo.todoId)}>Delete</button>
    </li>
  );
}