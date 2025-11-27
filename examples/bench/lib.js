import { createApp } from "../../src/index.js";

const app = createApp();
const qp = new URLSearchParams(location.search);
const n = Number(qp.get("n")) || 1000;
const k = Number(qp.get("k")) || 1000;

const items = app.state([]);
const run = app.state(0);

const UI = app.expose({ items, run }).template /*html*/ `
  <div>
    <p :nix-text="run"></p>
    <div>
      <p nix-for="item in items" :nix-text="item.label"></p>
    </div>
  </div>
`;

function makeData(cnt) {
  const a = [];
  for (let i = 0; i < cnt; i++) a.push({ id: i, label: "Item " + i });
  return a;
}

function mount(container) {
  items.value = makeData(n);
  performance.mark("mount:start");
  const inst = app.mount(UI, container);
  performance.mark("mount:end");
  performance.measure("lib:mount", "mount:start", "mount:end");
  return inst;
}

async function update() {
  performance.mark("update:start");
  for (let i = 0; i < k; i++) {
    const idx = (i * 13) % n;
    const next = items.value.slice();
    next[idx] = { ...next[idx], label: "Item " + idx + "*" + i };
    items.value = next;
  }
  run.value++;
  await new Promise((r) => requestAnimationFrame(() => r()));
  performance.mark("update:end");
  performance.measure("lib:update", "update:start", "update:end");
}

async function fps(d = 2000) {
  let frames = 0;
  const end = performance.now() + d;
  return new Promise((r) => {
    function tick() {
      frames++;
      if (performance.now() < end) {
        requestAnimationFrame(tick);
      } else r((frames * 1000) / d);
    }
    requestAnimationFrame(tick);
  });
}

async function runBench() {
  const container = document.getElementById("app");
  mount(container);
  await update();
  const f = await fps();
  const measures = performance.getEntriesByType("measure");
  const out = document.getElementById("out");
  out.textContent = JSON.stringify(
    measures
      .map((m) => ({ name: m.name, ms: +m.duration.toFixed(2) }))
      .concat([{ name: "lib:fps", ms: +f.toFixed(1) }]),
    null,
    2,
  );
}

runBench();
