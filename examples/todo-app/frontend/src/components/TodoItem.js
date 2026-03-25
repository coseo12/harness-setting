import { updateTodo, deleteTodo } from '../api.js';

export class TodoItem {
  constructor(container, todo, onChange) {
    this.container = container;
    this.todo = todo;
    this.onChange = onChange;
  }

  mount() {
    const { id, title, description, completed } = this.todo;

    this.container.className = `todo-item ${completed ? 'completed' : ''}`;
    this.container.innerHTML = `
      <label class="todo-checkbox">
        <input type="checkbox" ${completed ? 'checked' : ''} />
        <span class="todo-title">${this.escapeHtml(title)}</span>
      </label>
      ${description ? `<p class="todo-desc">${this.escapeHtml(description)}</p>` : ''}
      <button class="delete-btn" aria-label="삭제">✕</button>
    `;

    // 완료 토글
    const checkbox = this.container.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', async () => {
      try {
        await updateTodo(id, { completed: checkbox.checked });
        this.onChange();
      } catch (err) {
        alert(err.message);
        checkbox.checked = !checkbox.checked;
      }
    });

    // 삭제
    const deleteBtn = this.container.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', async () => {
      try {
        await deleteTodo(id);
        this.onChange();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // XSS 방지
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
