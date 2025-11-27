import { template } from './template.js';
import { exposeScope } from './expose.js';

const components = new Map();

export function define(name, tplOrFactory) {
  components.set(name.toLowerCase(), tplOrFactory);
}

export function componentsScope(defs) {
  const local = new Map();

  for (const k in defs) {
    const v = defs[k];
    local.set(k.toLowerCase(), v);
  }

  return {
    expose(defs2) {
      const scoped = exposeScope(defs2);
      return {
        template(strings, ...parts) {
          const res = scoped.template(strings, ...parts);
          res.localComponents = local;
          return res;
        },
      };
    },
    template(strings, ...parts) {
      const res = template(strings, ...parts);
      res.localComponents = local;

      return res;
    },
  };
}

export { components };
