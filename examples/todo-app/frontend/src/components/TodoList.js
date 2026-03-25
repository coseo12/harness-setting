import { TodoItem } from './TodoItem.js';

export class TodoList {
  constructor(container, todos, onChange) {
    this.container = container;
    this.todos = todos;
    this.onChange = onChange;
  }

  mount() {
    if (this.todos.length === 0) {
      this.container.innerHTML = '<p class="empty-message">할 일이 없습니다.</p>';
      return;
    }

    this.container.innerHTML = '<ul class="todo-list"></ul>';
    const ul = this.container.querySelector('ul');

    this.todos.forEach((todo) => {
      const li = document.createElement('li');
      const item = new TodoItem(li, todo, this.onChange);
      item.mount();
      ul.appendChild(li);
    });
  }
}
