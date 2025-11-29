import { createTodoInput } from './components/TodoInput.js';

export function createTodoUI(app, model) {
  const TodoInput = createTodoInput(app, model);

  const UIFactory = app.createComponent(
    {
      components: { TodoInput },
      expose: {
        todos: model.todos,
        total: model.total,
      },
    },
    ({ template }) => template/*html*/ `
        <div style="max-width: 480px;">
          <h2>Todos (total: <span nix-text="total"></span>)</h2>
          <TodoInput />
          <div nix-for="item in todos">
            <p :nix-text="item"></p>
          </div>
        </div>
      `
  );

  return UIFactory();
}
