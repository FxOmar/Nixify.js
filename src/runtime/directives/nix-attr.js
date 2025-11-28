import { directive } from './core.js';
import { cleanupEffect } from '../../reactivity.js';

directive('attr', (el, { expression }, helpers) => {
  const raw = Array.from(el.attributes).find((a) => a.name.startsWith('nix-attr-') || a.name.startsWith(':attr-'));
  if (!raw) return;
  const attrName = raw.name.replace(/^:attr-/, '').replace(/^nix-attr-/, '');
  const run = () => {
    const v = helpers.evaluate(expression);
    if (attrName === 'value') {
      el.value = v == null ? '' : '' + v;
    } else if (attrName === 'checked') {
      el.checked = !!v;
    } else {
      const val = v == null ? '' : '' + v;
      el.setAttribute(attrName, val);
    }
  };
  const runner = helpers.effect(run);
  helpers.cleanup(() => cleanupEffect(runner));
});