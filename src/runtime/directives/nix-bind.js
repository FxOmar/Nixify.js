import { directive } from './core.js';
import { cleanupEffect } from '../../reactivity.js';
import { vars } from '../expose.js';

directive('bind', (el, { expression }, helpers) => {
  const raw = Array.from(el.attributes).find(
    (a) =>
      a.name.startsWith('nix-bind-') ||
      a.name.startsWith(':bind-') ||
      a.name.startsWith('nix-bind:') ||
      a.name.startsWith(':bind:')
  );

  if (!raw) return;

  const prop = raw.name
    .replace(/^:bind-/, '')
    .replace(/^nix-bind-/, '')
    .replace(/^:bind:/, '')
    .replace(/^nix-bind:/, '');

  const name = (expression || '').trim();
  const getter = vars.get(name);
  const box = getter ? getter() : null;

  if (!box || typeof box !== 'object' || !('value' in box)) return;

  const setProp = (v) => {
    if (prop === 'value') {
      el.value = v == null ? '' : '' + v;
    } else if (prop === 'checked') {
      el.checked = !!v;
    } else {
      el[prop] = v;
    }
  };

  const readProp = () => {
    if (prop === 'value') return el.value;
    if (prop === 'checked') return !!el.checked;
    return el[prop];
  };

  const run = () => {
    setProp(box.value);
  };

  const runner = helpers.effect(run);
  helpers.cleanup(() => cleanupEffect(runner));

  const evt = prop === 'checked' ? 'change' : 'input';

  const handler = () => {
    try {
      box.value = readProp();
    } catch {}
  };

  el.addEventListener(evt, handler);

  helpers.cleanup(() => el.removeEventListener(evt, handler));
});
