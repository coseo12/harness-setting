import { fetchTodos } from '../api.js';
import { AddTodo } from './AddTodo.js';
import { TodoList } from './TodoList.js';

export class TodoApp {
  constructor(container) {
    this.container = container;
    this.todos = [];
    this.filter = '';
  }

  async mount() {
    this.render();
    await this.loadTodos();
  }

  async loadTodos() {
    try {
      const { todos } = await fetchTodos(this.filter);
      this.todos = todos;
      this.renderList();
    } catch (err) {
      console.error('할 일 로드 실패:', err);
    }
  }

  setFilter(filter) {
    this.filter = filter;
    // 필터 버튼 활성 상태 업데이트
    this.container.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    this.loadTodos();
  }

  render() {
    this.container.innerHTML = `
      <div class="todo-app">
        <h1>할 일 목록</h1>
        <div id="add-todo-form"></div>
        <div class="filters">
          <button class="filter-btn active" data-filter="">전체</button>
          <button class="filter-btn" data-filter="active">미완료</button>
          <button class="filter-btn" data-filter="completed">완료</button>
        </div>
        <div id="todo-list"></div>
      </div>
    `;

    // 필터 버튼 이벤트
    this.container.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => this.setFilter(btn.dataset.filter));
    });

    // 추가 폼
    const formContainer = this.container.querySelector('#add-todo-form');
    this.addTodo = new AddTodo(formContainer, () => this.loadTodos());
    this.addTodo.mount();
  }

  renderList() {
    const listContainer = this.container.querySelector('#todo-list');
    const todoList = new TodoList(listContainer, this.todos, () =>
      this.loadTodos()
    );
    todoList.mount();
  }
}
