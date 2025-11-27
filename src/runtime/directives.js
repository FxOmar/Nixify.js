import { effect, cleanupEffect } from "../reactivity.js";
import { vars } from "./expose.js";

const prefix = "nix-";

let directiveHandlers = {};

export function directive(name, callback) {
  if (!name.startsWith(prefix)) {
    name = prefix + name;
  }
  directiveHandlers[name] = callback;
}

function dispatchDirective(el, name, payload, ctx, cleanups, evaluate) {
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
  if (n.startsWith(":")) n = n.slice(1);
  if (!n.startsWith(prefix)) n = prefix + n;
  return n;
}

function makeEval(ctx) {
  console.log("makeEval", ctx);
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

  // Include root element itself, not just children
  const els = root.querySelectorAll("*");

  els.forEach((el) => {
    console.log("applyDirectives", el);
    const attrs = Array.from(el.attributes); // Convert to array to avoid live collection issues

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
        (expr, locals) => evaluate(expr, locals),
      );
    }
  });
}

directive("text", (el, { expression }, helpers) => {
  const run = () => {
    const v = helpers.evaluate(expression);
    el.textContent = v == null ? "" : "" + v;
  };
  const runner = helpers.effect(run);
  helpers.cleanup(() => cleanupEffect(runner));
});

directive("html", (el, { expression }, helpers) => {
  const run = () => {
    const v = helpers.evaluate(expression);
    console.log("html", v);
    el.innerHTML = v == null ? "" : "" + v;
  };
  const runner = helpers.effect(run);
  helpers.cleanup(() => cleanupEffect(runner));
});

directive("show", (el, { expression }, helpers) => {
  const run = () => {
    const v = helpers.evaluate(expression);
    el.style.display = v ? "" : "none";
  };
  const runner = helpers.effect(run);
  helpers.cleanup(() => cleanupEffect(runner));
});

directive("for", (el, { expression }, helpers) => {
  // Parse expression like "item in items" or "item, index in items"
  const forMatch = expression.match(
    /^(?:([\w$]+)(?:\s*,\s*([\w$]+))?\s+in\s+)?(.+)$/,
  );

  if (!forMatch) {
    console.error("Invalid for expression:", expression);
    return;
  }

  const itemName = forMatch[1] || "item";
  const indexName = forMatch[2] || "index";
  const collectionExpr = forMatch[3];

  // Store the template
  const template = el.innerHTML;
  const parent = el.parentNode;
  const marker = document.createComment(`nix-for: ${expression}`);

  // Replace the element with a marker comment
  parent.replaceChild(marker, el);

  let renderedElements = [];
  let previousCollection = null;

  const run = () => {
    // Evaluate the collection
    const collection = helpers.evaluate(collectionExpr);

    // Skip if collection hasn't changed (deep comparison for primitives)
    if (collection === previousCollection) return;

    // For arrays/objects, check if content actually changed
    if (Array.isArray(collection) && Array.isArray(previousCollection)) {
      if (
        collection.length === previousCollection.length &&
        collection.every((item, idx) => item === previousCollection[idx])
      ) {
        return;
      }
    }

    previousCollection = collection;

    // Cleanup previous elements
    renderedElements.forEach((elem) => elem.remove());
    renderedElements = [];

    if (!collection) return;

    // Convert to array if needed
    const items = Array.isArray(collection)
      ? collection
      : typeof collection === "object"
        ? Object.entries(collection)
        : [];

    // Render each item
    items.forEach((item, index) => {
      // Create a new element from template
      const clone = document.createElement(el.tagName);
      clone.innerHTML = template;

      // Copy attributes except nix-for
      Array.from(el.attributes).forEach((attr) => {
        if (!attr.name.startsWith("nix-for") && !attr.name.startsWith(":for")) {
          clone.setAttribute(attr.name, attr.value);
        }
      });

      // Create local context for this iteration
      const locals = {
        [itemName]: item,
        [indexName]: index,
      };

      // Apply directives to the cloned element with local scope
      const cloneCleanups = [];
      const cloneEvaluate = (expr, additionalLocals = {}) => {
        return helpers.evaluate(expr, { ...locals, ...additionalLocals });
      };

      // Process directives on clone
      const allElements = [clone, ...Array.from(clone.querySelectorAll("*"))];

      allElements.forEach((childEl) => {
        const attrs = Array.from(childEl.attributes);
        attrs.forEach((attr) => {
          const name = attr.name.startsWith(":")
            ? attr.name.slice(1)
            : attr.name;

          if (!name.startsWith(prefix)) return;

          const handler = directiveHandlers[name];
          if (handler && name !== prefix + "for") {
            handler(
              childEl,
              {
                value: attr.value,
                modifiers: [],
                expression: attr.value,
              },
              {
                ctx: helpers.ctx,
                effect,
                cleanupEffect,
                cleanup: (fn) => cloneCleanups.push(fn),
                evaluate: cloneEvaluate,
              },
            );
          }
        });
      });

      // Insert into DOM
      parent.insertBefore(clone, marker);
      renderedElements.push(clone);

      // Register cleanup for this clone
      helpers.cleanup(() => {
        cloneCleanups.forEach((fn) => fn());
      });
    });
  };

  const runner = helpers.effect(run);

  helpers.cleanup(() => {
    cleanupEffect(runner);
    renderedElements.forEach((elem) => elem.remove());
  });
});
