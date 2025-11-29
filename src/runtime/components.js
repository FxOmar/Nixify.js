import { template } from './template.js';
import { exposeScope, vars } from './expose.js';

const components = new Map();

export function define(name, tplOrFactory) {
  components.set(name.toLowerCase(), tplOrFactory);
}

export function createComponent(configOrSetup, maybeSetup) {
  const buildLocalVars = (defs) => {
    const m = new Map();
    for (const k in defs || {}) {
      const v = defs[k];
      const getter =
        typeof v === 'function'
          ? v
          : () => (v && typeof v === 'object' && 'value' in v ? v.value : v);
      m.set(k, getter);
    }
    return m;
  };

  if (typeof configOrSetup === 'function') {
    const setup = configOrSetup;

    return function () {
      const local = new Map();

      const register = (defs) => {
        for (const k in defs) local.set(k.toLowerCase(), defs[k]);
      };

      const scopedExpose = (defs2) => {
        const scoped = exposeScope(defs2);

        return {
          template(strings, ...parts) {
            const res = scoped.template(strings, ...parts);
            res.localComponents = local;
            return res;
          },
        };
      };

      const scopedTemplate = (strings, ...parts) => {
        const res = template(strings, ...parts);
        res.localComponents = local;
        return res;
      };

      return setup({
        components: register,
        expose: scopedExpose,
        template: scopedTemplate,
      });
    };
  } else {
    const config = configOrSetup || {};
    const setup = maybeSetup;

    return function () {
      const local = new Map();
      const comps = config.components || {};

      for (const k in comps) local.set(k.toLowerCase(), comps[k]);

      const localVars = buildLocalVars(config.expose || {});
      for (const k in config.expose || {}) {
        const v = config.expose[k];
        vars.set(k, () => v);
      }

      const scopedTemplate = (strings, ...parts) => {
        const res = template(strings, ...parts);
        res.localComponents = local;
        res.localVars = localVars;
        return res;
      };

      return setup({ template: scopedTemplate });
    };
  }
}

export { components };
