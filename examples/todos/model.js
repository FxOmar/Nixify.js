import { state, computed } from '../../src/index.js';

export function createModel() {
  const todos = state(['Buy milk', 'Buy eggs', 'Buy bread']);
  const text = state('Hello, World!');
  const total = computed(() => `${todos.value.length} todos`);

  function addTodo() {
    const v = text.value.trim();

    if (!v) return;

    todos.value = [...todos.value, v];
    text.value = '';
  }

  function removeLast() {
    todos.value = todos.value.slice(0, -1);
  }

  return { todos, text, total, addTodo, removeLast };
}
