import { directive } from "./core.js";
import { dispatchDirective, prefix } from "./core.js";
import { cleanupEffect } from "../../reactivity.js";
import { components } from "../components.js";
import { domScanner } from "../mount.js";
import { setNodeLocalVars } from "../context.js";

directive("for", (el, { expression }, helpers) => {
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

  const template = el.innerHTML;
  const parent = el.parentNode;
  const marker = document.createComment(`nix-for: ${expression}`);
  const baseAttributes = [];

  Array.from(el.attributes).forEach((attr) => {
    if (!attr.name.startsWith("nix-for") && !attr.name.startsWith(":for")) {
      baseAttributes.push([attr.name, attr.value]);
    }
  });

  parent.replaceChild(marker, el);

  let renderedElements = [];
  let previousCollection = null;

  const run = () => {
    const collection = helpers.evaluate(collectionExpr);

    if (collection === previousCollection) return;

    if (Array.isArray(collection) && Array.isArray(previousCollection)) {
      if (
        collection.length === previousCollection.length &&
        collection.every((item, idx) => item === previousCollection[idx])
      ) {
        return;
      }
    }

    previousCollection = collection;

    renderedElements.forEach((elem) => elem.remove());
    renderedElements = [];

    if (!collection) return;

    const items = Array.isArray(collection)
      ? collection
      : typeof collection === "object"
        ? Object.entries(collection)
        : [];

    const frag = document.createDocumentFragment();

    for (let index = 0; index < items.length; index++) {
      const item = items[index];

      const clone = document.createElement(el.tagName);

      clone.innerHTML = template;

      const lowerToComp = new Map();
      components.forEach((comp, name) => {
        lowerToComp.set(name.toLowerCase(), comp);
      });

      if (lowerToComp.size) {
        const selector = Array.from(lowerToComp.keys()).join(",");
        const matches = clone.querySelectorAll(selector);

        // matches.forEach((child) => {
        //   const comp = lowerToComp.get(child.tagName.toLowerCase());

        //   if (!comp) return;

        //   const childTpl = typeof comp === "function" ? comp() : comp;
        //   const childInst = domScanner(childTpl);
        //   const nodes = childInst.frag.querySelectorAll("*");

        //   nodes.forEach((n) => setNodeLocalVars(n, childTpl.localVars));

        //   child.replaceWith(childInst.frag);
        //   cloneCleanups.push(...childInst.cleanups);
        // });
      }

      for (let i = 0; i < baseAttributes.length; i++) {
        const pair = baseAttributes[i];
        clone.setAttribute(pair[0], pair[1]);
      }

      const locals = {
        [itemName]: item,
        [indexName]: index,
      };

      const cloneCleanups = [];

      const cloneEvaluate = (expr, additionalLocals = {}) => {
        return helpers.evaluate(expr, { ...locals, ...additionalLocals });
      };

      const processEl = (childEl) => {
        const attrs = childEl.attributes;

        for (let j = 0; j < attrs.length; j++) {
          const attr = attrs[j];

          let name = attr.name;

          if (
            !name.startsWith(prefix) &&
            !/^:[a-zA-Z]+$/.test(name) &&
            !name.startsWith("nix-bind:")
          ) {
            continue;
          }

          if (name === prefix + "for") continue;

          dispatchDirective(
            childEl,
            name,
            {
              value: attr.value,
              modifiers: [],
              expression: attr.value,
            },
            helpers.ctx,
            cloneCleanups,
            cloneEvaluate,
          );
        }
      };

      processEl(clone);

      const descendants = clone.querySelectorAll("*");

      for (let d = 0; d < descendants.length; d++) {
        processEl(descendants[d]);
      }

      frag.appendChild(clone);
      renderedElements.push(clone);

      helpers.cleanup(() => {
        cloneCleanups.forEach((fn) => fn());
      });
    }
    parent.insertBefore(frag, marker);
  };

  const runner = helpers.effect(run);

  helpers.cleanup(() => {
    cleanupEffect(runner);
    renderedElements.forEach((elem) => elem.remove());
  });
});
