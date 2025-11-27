import "./style.css";
import { createApp } from "../../src/index.js";

const app = createApp();

const count = app.state(0);

const Counter = app.expose({ count }).template /*html*/ `
  <div style="font-family: system-ui, sans-serif; padding: 12px; max-width: 380px;">
    <h2>Counter (example)</h2>
    <p :nix-text="count"></p>
    <button onclick=${() =>
      count.value++} style="padding:8px 12px">Increment</button>
    <button onclick=${() =>
      (count.value = 0)} style="padding:8px 12px; margin-left:8px">Reset</button>
    <p :nix-text="count % 2 === 0 ? 'Even' : 'Odd'"></p>
  </div>
`;

const App = app.components({ Counter }).expose({ count }).template /*html*/ `
  <h1>Counter App</h1>
  <Counter />

  <h2 nix-show="count > 0">Counter Will be hidden in 5 seconds</h2>
`;

app.mount(App, document.getElementById("app"));
