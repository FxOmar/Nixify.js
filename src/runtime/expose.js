const vars = new Map();

export function exposeScope(defs) {
  const local = new Map();
  for (const k in defs) {
    const v = defs[k];
    const getter =
      typeof v === 'function'
        ? v
        : () => (v && typeof v === 'object' && 'value' in v ? v.value : v);
    local.set(k, getter);
    vars.set(k, () => v);
  }
  return {
    template(strings, ...parts) {
      const res = template(strings, ...parts);
      res.localVars = local;
      return res;
    },
  };
}

export { vars };
import { template } from './template.js';
