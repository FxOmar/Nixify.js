import { directivesScanner } from "./directives.js";

export function domScanner(target) {
  /**
   * directives scanner.
   */
  const walker = document.createTreeWalker(target, NodeFilter.SHOW_ELEMENT);

  const nodesToProcess = [];

  let node;

  while ((node = walker.nextNode())) {
    // Cache attributes to avoid repeated Array.from calls
    const attrs = node.attributes;
    let hasNix = false;

    for (let i = 0; i < attrs.length; i++) {
      if (attrs[i].name.startsWith("nix-")) {
        hasNix = true;
        break;
      }
    }

    if (hasNix) {
      nodesToProcess.push(node);
    }
  }

  nodesToProcess.forEach((el) => directivesScanner(el));
}

/**
 * Mount a template result into a target DOM node.
 *
 * @param {import('./template.js').TemplateResult} tplResult The template result to mount.
 * @param {Node} target The target DOM node to mount into.
 * @returns {Object} An object with an unmount method to remove the mounted content.
 */
export function mount(target = document.body) {
  const start = performance.now();
  domScanner(target);

  const end = performance.now();
  console.log(`Mounting took ${end - start} ms`);
}
