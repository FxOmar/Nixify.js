import { components } from "./components.js";
import { applyDirectives } from "./directives.js";
import { setNodeLocalVars } from "./context.js";

function instantiateFragment(tplResult) {
  if (!tplResult || !tplResult.frag) {
    return { frag: document.createDocumentFragment(), cleanups: [] };
  }

  const instanceFrag = tplResult.frag.cloneNode(true);

  const cleanups = [];

  const registries = [];

  /**
   * Add the local components registry to the list of registries.
   */
  if (tplResult.localComponents) registries.push(tplResult.localComponents);

  /**
   * Add the global components registry to the list of registries.
   */
  registries.push(components);

  /**
   * Instantiate child components.
   */
  for (const registry of registries) {
    const lowerToComp = new Map();

    registry.forEach((comp, name) => {
      lowerToComp.set(name.toLowerCase(), comp);
    });

    if (lowerToComp.size) {
      const selector = Array.from(lowerToComp.keys()).join(",");

      const matches = instanceFrag.querySelectorAll(selector);

      matches.forEach((el) => {
        const comp = lowerToComp.get(el.tagName.toLowerCase());

        if (!comp) return;

        const childTpl = typeof comp === "function" ? comp() : comp;

        const child = instantiateFragment(childTpl);

        const nodes = child.frag.querySelectorAll("*");
        nodes.forEach((n) => setNodeLocalVars(n, childTpl.localVars));

        el.replaceWith(child.frag);
        cleanups.push(...child.cleanups);
      });
    }
  }

  /**
   * Apply directives.
   */
  applyDirectives(instanceFrag, { localVars: tplResult.localVars }, cleanups);

  /**
   * Add event listeners.
   */
  tplResult.partsMeta.forEach((meta, i) => {
    if (meta.kind === "event") {
      const token = meta.token;
      const selector = `[${meta.name}="${token}"], [${meta.name}='${token}']`;
      const matches = instanceFrag.querySelectorAll(selector);

      matches.forEach((el) => {
        el.removeAttribute(meta.name);

        const handler = tplResult.parts[i];

        if (typeof handler !== "function") return;
        const listener = function (ev) {
          try {
            handler(ev);
          } catch {}
        };

        el.addEventListener(meta.name.slice(2), listener);

        cleanups.push(() =>
          el.removeEventListener(meta.name.slice(2), listener),
        );
      });
    }
  });

  return { frag: instanceFrag, cleanups };
}

/**
 * Mount a template result into a target DOM node.
 *
 * @param {import('./template.js').TemplateResult} tplResult The template result to mount.
 * @param {Node} target The target DOM node to mount into.
 * @returns {Object} An object with an unmount method to remove the mounted content.
 */
export function mount(tplResult, target) {
  const { frag, cleanups } = instantiateFragment(tplResult);

  target.appendChild(frag);

  return {
    unmount() {
      cleanups.forEach((fn) => {
        try {
          fn();
        } catch {}
      });
      while (target.firstChild) target.removeChild(target.firstChild);
    },
  };
}

export { instantiateFragment };
