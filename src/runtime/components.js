import { template } from "./template.js";
import { exposeScope, vars } from "./expose.js";

const components = new Map();

export function define(name, tplOrFactory) {
  components.set(name.toLowerCase(), tplOrFactory);
}

/**
 * Creates a component factory function.
 *
 * @param {Object} configOrSetup - The component configuration or setup function.
 * @param {Function} [maybeSetup] - The setup function if the first argument is config.
 * @returns {Function} - A factory function that creates component instances.
 */
export function createComponent(configOrSetup, maybeSetup) {
  const buildLocalVars = (defs) => {
    const m = new Map();

    for (const k in defs || {}) {
      const v = defs[k];
      const getter =
        typeof v === "function"
          ? v
          : () => (v && typeof v === "object" && "value" in v ? v.value : v);

      m.set(k, getter);
    }

    return m;
  };

  const config = configOrSetup || {};
  const setup = maybeSetup;

  return function () {
    const local = new Map();
    const comps = config.components || {};

    console.log("Defining component with components:", configOrSetup);

    for (const k in comps) {
      local.set(k.toLowerCase(), comps[k]);
    }

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

export { components };
