const depsMap = new WeakMap();
let currentEffect = null;

const q = new Set();
let flushing = false;

function schedule(effect) {
  q.add(effect);
  if (!flushing) {
    flushing = true;
    Promise.resolve().then(() => {
      try {
        q.forEach((e) => e());
      } finally {
        q.clear();
        flushing = false;
      }
    });
  }
}

function track(target, key) {
  if (!currentEffect) return;
  let map = depsMap.get(target);
  if (!map) {
    map = new Map();
    depsMap.set(target, map);
  }
  let dep = map.get(key);
  if (!dep) {
    dep = new Set();
    map.set(key, dep);
  }
  if (!dep.has(currentEffect)) {
    dep.add(currentEffect);
    currentEffect.deps.push(dep);
  }
}

function trigger(target, key) {
  const map = depsMap.get(target);
  if (!map) return;
  const dep = map.get(key);
  if (!dep) return;
  dep.forEach((effect) => schedule(effect));
}

export function cleanupEffect(effect) {
  if (!effect.deps) return;

  for (const dep of effect.deps) {
    dep.delete(effect);
  }

  effect.deps.length = 0;
}

export function effect(fn) {
  const runner = () => {
    cleanupEffect(runner);
    currentEffect = runner;
    try {
      fn();
    } finally {
      currentEffect = null;
    }
  };
  runner.deps = [];
  runner();
  return runner;
}

export function state(init) {
  const box = { value: init };
  return new Proxy(box, {
    get(t, k) {
      if (k === 'value') track(t, 'value');
      return Reflect.get(t, k);
    },
    set(t, k, v) {
      const ok = Reflect.set(t, k, v);
      if (ok) trigger(t, 'value');
      return ok;
    },
  });
}

export function computed(fn) {
  const c = state(undefined);
  effect(() => {
    c.value = fn();
  });
  return c;
}
