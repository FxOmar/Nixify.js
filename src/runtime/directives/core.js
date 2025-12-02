import { effect, cleanupEffect } from "../../reactivity.js";
import { vars } from "../expose.js";
import { getNodeLocalVars } from "../context.js";

export const prefix = "nix-";

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

    if (!handler) return;
  }

  handler(el, payload, {
    ctx,
    effect,
    cleanupEffect,
    cleanup: (fn) => cleanups.push(fn),
    evaluate: (expr, locals) => evaluate(expr, locals),
  });
}

function normalizeName(attrName) {
  let n = attrName;

  if (n.startsWith(":")) {
    const candidate = n.slice(1);
    const base = candidate.split(/[-:]/)[0];
    const known = ["text", "html", "show", "for", "bind"];

    n = known.includes(base) ? candidate : `bind:${candidate}`;
  }

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

export function directivesScanner(root, ctx = {}, cleanups = []) {
  const baseEvaluate = makeEval(ctx);

  let el = root;

  const attrs = el.attributes;
  const attrCount = attrs.length;

  // Cache local vars lookup
  let localVars = null;
  let evalFn = null;
  let hasCheckedLocalVars = false;

  for (let i = 0; i < attrCount; i++) {
    const attr = attrs[i];

    const name = normalizeName(attr.name);
    const value = attr.value;

    // Lazy initialize localVars and evalFn only if needed
    if (!hasCheckedLocalVars) {
      localVars = getNodeLocalVars(el);
      evalFn = localVars ? makeEval({ localVars }) : baseEvaluate;
      hasCheckedLocalVars = true;
    }

    dispatchDirective(
      el,
      name,
      { value, modifiers: [], expression: value },
      ctx,
      cleanups,
      (expr, locals) => evalFn(expr, locals),
    );
  }
}
