export function createTodoInput(app, model) {
  const text = model.text;

  const make = app.createComponent(
    {
      expose: {
        text,
      },
    },
    ({ template }) => template/*html*/ `
      <div>
        <h1 nix-text="text"></h1>
      
        <input type="text" :value="text" placeholder="Add a todo" />

        <button type="button" onclick=${model.addTodo}>Add</button>
        <button type="button" onclick=${model.removeLast}>Remove Last</button>
      </div>
    `
  );

  return make();
}
