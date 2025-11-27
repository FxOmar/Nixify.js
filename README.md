# Vanilla-JS Reactive UI Library

A tiny, template-first UI runtime built for direct DOM updates without a virtual DOM. It uses fine‑grained signals and effects to update exactly the nodes that need changing, aiming to be faster and simpler than typical VDOM frameworks.

## Highlights

- Direct DOM updates, no diffing
- Fine‑grained reactivity via `signal`, `effect`, `computed`
- Template literals with dynamic parts, event tokens, and scoped placeholders
- Component registry with local scoping (`components`) and local variables (`expose`)
- Attribute-driven text binding with `:nix-text`
- Minimal loop construct `nix-for` (Vue’s `v-for`‑like) with scoped item/index
- Library mode build (ESM + CJS) ready for npm consumption

## Quick Start (Dev)

- Install deps: `npm install`
- Run examples:
  - Counter: `npm run examples:counter`
  - Todos: `npm run examples:todos`
- Dev server: open `http://localhost:5173/`

Root `index.html` loads the examples. You can switch pages with their URLs:

- Counter: `http://localhost:5173/examples/counter/index.html`
- Todos: `http://localhost:5173/examples/todos/index.html`

## Build (Library)

- `npm run build`
- Outputs:
  - `dist/index.es.js` (ESM)
  - `dist/index.cjs` (CommonJS)
- `package.json` exports are configured:
  - `import` → `./dist/index.es.js`
  - `require` → `./dist/index.cjs`

## Using the Library

```js
import { createApp } from 'vanilla-js';

const app = createApp();

const count = app.state(0);
const tmpl = app.template`
  <div>
    <p>Current: ${() => count.value}</p>
    <button onclick=${() => count.value++}>Increment</button>
  </div>
`;

app.mount(tmpl, document.getElementById('app'));
```

### Attribute Text Binding (`:nix-text`)

Prefer attribute-driven dynamic content:

```js
const app = createApp();
const todos = app.state(['Read', 'Code']);

const ui = app.expose({ todos }).template`
  <div>
    <p :nix-text="todos.length"></p>
    <div nix-for="item in todos">
      <p :nix-text="item"></p>
    </div>
  </div>
`;

app.mount(ui, document.getElementById('app'));
```

### Components and Scoped Variables

Locally scope components and variables per template:

```js
const app = createApp();
const text = app.state('');
const todos = app.state([]);
const total = app.computed(() => `${todos.value.length} todos`);

const TodoInput = app.expose({ text }).template`
  <div>
    <input placeholder="Add" oninput=${(e) => (text.value = e.target.value)} />
    <button onclick=${() => {
      if (text.value.trim()) {
        todos.value = [...todos.value, text.value.trim()];
        text.value = '';
      }
    }}>Add</button>
  </div>
`;

const App = app.components({ TodoInput }).expose({ todos, total }).template`
  <div>
    <h2>Todos</h2>
    <TodoInput />
    <p :nix-text="total"></p>
    <div nix-for="item in todos">
      <p :nix-text="item"></p>
    </div>
  </div>
`;

app.mount(App, document.getElementById('app'));
```

## API Overview

- `createApp()` → `{ signal, computed, template, mount, define, components, expose }`
- Reactivity:
  - `signal(init)` → `{ value }` reactive box
  - `computed(fn)` → derived signal updated by an internal `effect`
  - `effect(fn)` → tracked autorun with automatic dependency cleanup
- Templates:
  - `template\`...${expr}...\``→ builds a`DocumentFragment` with placeholders
  - Event bindings: `${() => handler}` for attributes like `onclick`
  - Text placeholders: comment markers (internal) or `:nix-text="expr"`
- Mount:
  - `mount(tplResult, target)` → instantiates fragment, binds text and events, returns `{ unmount }`
- Components:
  - Global: `define(name, templateOrFactory)`
  - Local: `components({ Name: templateOrFactory })`
- Scoped Variables:
  - `expose({ varName: getterOrSignalOrValue })` → local identifiers accessible in template expressions

## How It Works (Design)

- Fine‑grained dependencies
  - A `WeakMap` maps each reactive target to a `Map(key → Set(effects))`
  - When a `signal`’s `value` is read inside an `effect`, the effect is added to that key’s set
  - When `value` changes, only those effects re-run
- Scheduler
  - Effects are queued and flushed in a microtask to deduplicate reruns and stabilize updates
- Template parsing
  - Template literals are converted to HTML strings
  - Dynamic parts are marked as either text placeholders or event tokens
  - Self‑closing component tags (e.g., `<Counter />`) are normalized to paired tags
  - Comments like `<!--nix:<tplId>:<index>-->` scope placeholders per template
- Instantiation & Binding
  - The fragment is cloned
  - Component tags are replaced by their instantiated fragments (local registry first, then global)
  - `nix-for` loops:
    - Parse `item` and optional `index` names and the items identifier
    - Clone the element per item and bind inner `:nix-text` using `(item, index)` context
  - `:nix-text`:
    - Outside loops, expressions are evaluated with local and global exposed variables
    - Inside loops, evaluated with `(item, index)`
  - Event tokens are replaced by `addEventListener` handlers and cleaned up on unmount
- No VDOM
  - Text nodes and attributes are updated directly where needed
  - Precise reactivity avoids redundant updates and layout thrash

## Examples in Repo

- `examples/counter` — basic counter showing signals and events
- `examples/todos` — demonstrates loops, `:nix-text`, local components, and scoped expose

## Project Structure

```
src/
  reactivity.js           # signals/effects/computed
  runtime/
    index.js              # createApp assembly
    template.js           # template parsing
    mount.js              # instantiate/bind/mount
    components.js         # global registry, local components, chainable expose
    expose.js             # scoped variables builder
examples/
  counter/
    index.html
    main.js
  todos/
    index.html
    main.js
```

## Notes

- This is a prototype for speed and clarity; the API may evolve
- Expressions in `:nix-text` are evaluated using `new Function` with provided scopes; treat strings as trusted only in dev contexts
- For production, consider adding static analysis/transforms to avoid runtime parsing

## License

MIT
