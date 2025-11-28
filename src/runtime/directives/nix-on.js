import { directive } from './core.js';
import { cleanupEffect } from '../../reactivity.js';

directive('on', (el, { expression }, helpers) => {
  const raw = Array.from(el.attributes).find((a) => a.name.startsWith('nix-on-') || a.name.startsWith(':on-'));
  if (!raw) return;
  const evt = raw.name.replace(/^:on-/, '').replace(/^nix-on-/, '');

  const handler = (ev) => {
    try {
      helpers.evaluate(expression, { $event: ev });
    } catch {}
  };
  el.addEventListener(evt, handler);
  helpers.cleanup(() => el.removeEventListener(evt, handler));

  const runner = helpers.effect(() => {});
  helpers.cleanup(() => cleanupEffect(runner));
});