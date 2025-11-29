import { effect, cleanupEffect } from '../../reactivity.js';
import { vars } from '../expose.js';
import { getNodeLocalVars } from '../context.js';

const prefix = 'nix-';

let directiveHandlers = {};

export function directive(name, callback) {
  if (!name.startsWith(prefix)) {
    name = prefix + name;
  }

  directiveHandlers[name] = callback;
}

export function dispatchDirective(el, name, payload, ctx, cleanups, evaluate) {
  let handler = directiveHandlers[name];
  if (!handler) {
    const base = name.startsWith(prefix)
      ? name.slice(prefix.length).split(/[-:]/)[0]
      : name.split(/[-:]/)[0];
    const fallback = prefix + base;
    handler = directiveHandlers[fallback];
    if (!handler) return false;
  }

  handler(el, payload, {
    ctx,
    effect,
    cleanupEffect,
    cleanup: (fn) => cleanups.push(fn),
    evaluate: (expr, locals) => evaluate(expr, locals),
  });

  return true;
}

function normalizeName(attrName) {
  let n = attrName;
  if (n.startsWith(':')) n = n.slice(1);
  if (!n.startsWith(prefix)) n = prefix + n;
  return n;
}

function makeEval(ctx) {
  return function (expr, locals = {}) {
    const scope = {};
    if (ctx && ctx.localVars) {
      ctx.localVars.forEach((getter, k) => {
        scope[k] = getter();
      });
    }
    if (vars && vars.size) {
      vars.forEach((getter, k) => {
        if (!(k in scope)) scope[k] = getter();
      });
    }
    Object.assign(scope, locals);
    const names = Object.keys(scope);
    const values = names.map((k) => scope[k]);

    try {
      const fn = new Function(...names, `return (${expr});`);
      return fn(...values);
    } catch {
      return undefined;
    }
  };
}

export function applyDirectives(root, ctx, cleanups) {
  const run = () => {
    const baseEvaluate = makeEval(ctx);
    const els = root.querySelectorAll('*');

    els.forEach((el) => {
      const attrs = Array.from(el.attributes);

      for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i];
        const name = normalizeName(attr.name);
        const value = attr.value;
        const localVars = getNodeLocalVars(el);
        const evalFn = localVars ? makeEval({ localVars }) : baseEvaluate;

        dispatchDirective(
          el,
          name,
          { value, modifiers: [], expression: value },
          ctx,
          cleanups,
          (expr, locals) => evalFn(expr, locals)
        );
      }
    });
  };

  const isMounted = () =>
    root.nodeType === 11
      ? !!root.firstElementChild && root.firstElementChild.isConnected
      : root.isConnected;

  if (!isMounted()) {
    const tryRun = () => {
      if (isMounted()) run();
      else requestAnimationFrame(tryRun);
    };
    requestAnimationFrame(tryRun);
  } else {
    run();
  }
}

export { prefix };
