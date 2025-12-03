import { directive } from './core.js';
import { cleanupEffect } from '../../reactivity.js';

directive('if', (el, { expression }, helpers) => {
  const run = () => {
    const v = helpers.evaluate(expression);

    const placeholder = document.createComment('nix-if');

    el.parentNode.insertBefore(placeholder, el);

    let mounted = false;

    if (v && !mounted) {
      placeholder.parentNode.insertBefore(el, placeholder.nextSibling);
      mounted = true;
    } else if (!v && mounted) {
      el.remove();
      mounted = false;
    }
  };

  const runner = helpers.effect(run);
  helpers.cleanup(() => cleanupEffect(runner));
});
