import { TodoApp } from './components/TodoApp.js';

const app = document.getElementById('app');
const todoApp = new TodoApp(app);
todoApp.mount();
