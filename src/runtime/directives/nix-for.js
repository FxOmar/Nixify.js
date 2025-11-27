import { directive } from './core.js';
import { dispatchDirective, prefix } from './core.js';
import { cleanupEffect } from '../../reactivity.js';

directive('for', (el, { expression }, helpers) => {
  const forMatch = expression.match(
    /^(?:([\w$]+)(?:\s*,\s*([\w$]+))?\s+in\s+)?(.+)$/
  );

  if (!forMatch) {
    console.error('Invalid for expression:', expression);
    return;
  }

  const itemName = forMatch[1] || 'item';
  const indexName = forMatch[2] || 'index';
  const collectionExpr = forMatch[3];

  const template = el.innerHTML;
  const parent = el.parentNode;
  const marker = document.createComment(`nix-for: ${expression}`);

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
      : typeof collection === 'object'
      ? Object.entries(collection)
      : [];

    items.forEach((item, index) => {
      const clone = document.createElement(el.tagName);
      clone.innerHTML = template;

      Array.from(el.attributes).forEach((attr) => {
        if (!attr.name.startsWith('nix-for') && !attr.name.startsWith(':for')) {
          clone.setAttribute(attr.name, attr.value);
        }
      });

      const locals = {
        [itemName]: item,
        [indexName]: index,
      };

      const cloneCleanups = [];
      const cloneEvaluate = (expr, additionalLocals = {}) => {
        return helpers.evaluate(expr, { ...locals, ...additionalLocals });
      };

      const allElements = [clone, ...Array.from(clone.querySelectorAll('*'))];

      allElements.forEach((childEl) => {
        const attrs = Array.from(childEl.attributes);
        attrs.forEach((attr) => {
          let name = attr.name.startsWith(':') ? attr.name.slice(1) : attr.name;
          if (!name.startsWith(prefix)) name = prefix + name;
          if (name === prefix + 'for') return;

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
            cloneEvaluate
          );
        });
      });

      parent.insertBefore(clone, marker);
      renderedElements.push(clone);

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
