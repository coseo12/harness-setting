import { createTodo } from '../api.js';

export class AddTodo {
  constructor(container, onAdd) {
    this.container = container;
    this.onAdd = onAdd;
  }

  mount() {
    this.container.innerHTML = `
      <form class="add-todo-form">
        <input type="text" id="todo-title" placeholder="할 일을 입력하세요" required maxlength="200" />
        <input type="text" id="todo-desc" placeholder="설명 (선택)" maxlength="1000" />
        <button type="submit">추가</button>
      </form>
    `;

    const form = this.container.querySelector('form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const titleInput = form.querySelector('#todo-title');
      const descInput = form.querySelector('#todo-desc');
      const title = titleInput.value.trim();

      if (!title) return;

      try {
        await createTodo(title, descInput.value.trim());
        titleInput.value = '';
        descInput.value = '';
        this.onAdd();
      } catch (err) {
        alert(err.message);
      }
    });
  }
}
