import { createApp } from '../../src/index.js';

const app = createApp();

const todos = app.state([]);
const text = app.state('');

const total = app.computed(() => `${todos.value.length} todos`);

function addTodo() {
  const v = text.value.trim();

  if (!v) return;

  todos.value = [...todos.value, v];
  text.value = '';
}

function removeLast() {
  todos.value = todos.value.slice(0, -1);
}

const TodoInput = app.expose({ text }).template/*html*/ `
  <div>
    <input value="" placeholder="Add a todo" oninput=${(e) =>
      (text.value = e.target.value)} />
    <button onclick=${addTodo}>Add</button>
    <button onclick=${removeLast}>Remove Last</button>
  </div>
`;

const randomNumber = app.state(Math.random());

const html = `<div>
<h1>Hello World</h1>
</div>`;

const TodoUI = app
  .components({ TodoInput })
  .expose({ todos, total, randomNumber, html }).template/*html*/ `
  <div style="max-width: 480px;">
    <h2>Todos (random number: <span :nix-text="randomNumber"></span>)</h2>
    <TodoInput />
    <p :nix-text="total"></p>
    <div nix-html="html"></div>
    <div nix-for="item in todos">
      <p :nix-text="item"></p>
    </div>
  </div>
`;

app.mount(TodoUI, document.getElementById('app'));
