import { effect, cleanupEffect } from '../../reactivity.js';
import { vars } from '../expose.js';

const prefix = 'nix-';

let directiveHandlers = {};

export function directive(name, callback) {
  if (!name.startsWith(prefix)) {
    name = prefix + name;
  }
  directiveHandlers[name] = callback;
}

export function dispatchDirective(el, name, payload, ctx, cleanups, evaluate) {
  const handler = directiveHandlers[name];
  if (!handler) return false;
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
  console.log('makeEval', ctx);
  return function (expr, locals = {}) {
    const scope = {};
    if (ctx && ctx.localVars) {
      ctx.localVars.forEach((getter, k) => {
        scope[k] = getter();
      });
    }
    if (vars && vars.size) {
      vars.forEach((getter, k) => {
        scope[k] = getter();
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
  const evaluate = makeEval(ctx);

  const els = root.querySelectorAll('*');

  els.forEach((el) => {
    console.log('applyDirectives', el);
    const attrs = Array.from(el.attributes);

    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i];
      const name = normalizeName(attr.name);
      const value = attr.value;
      dispatchDirective(
        el,
        name,
        { value, modifiers: [], expression: value },
        ctx,
        cleanups,
        (expr, locals) => evaluate(expr, locals)
      );
    }
  });
}

export { prefix };
