import { directive, directivesScanner } from "./core.js";
import { components } from "../components.js";

directive("components", (el, { expression }) => {
  // Early validation
  if (!expression?.trim()) {
    console.warn("nix-components: invalid or empty expression");
    return;
  }

  // Parse component names once
  const componentNames = expression
    .replace(/[{}]/g, "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (componentNames.length === 0) {
    console.warn("nix-components: no component names found in expression");
    return;
  }

  // Filter components that exist in the template
  const activeComponents = componentNames.filter((name) =>
    el.content.querySelector(name.toLowerCase()),
  );

  if (activeComponents.length === 0) return;

  // Cache reference for insertion point
  let lastInsertedElement = null;

  // Process each component
  for (const [index, name] of activeComponents.entries()) {
    const comp = components.get(name.toLowerCase());

    if (!comp?.frag) {
      console.warn(
        `nix-components: component "${name}" not found or has no fragment`,
      );
      continue; // Skip this component but process others
    }

    // Clone and prepare the component
    const clone = comp.frag.cloneNode(true);
    const firstElement = clone.querySelector("*");

    if (!firstElement) {
      console.warn(`nix-components: component "${name}" has no elements`);
      continue;
    }

    firstElement.setAttribute("data-nix-component", name);

    // Insert the component
    if (index === 0) {
      el.replaceWith(clone);
      lastInsertedElement = firstElement;
    } else {
      lastInsertedElement.after(clone);
      lastInsertedElement = firstElement;
    }

    const cleanups = [];

    /**
     * Add event listeners.
     */
    // if (comp.partsMeta.length) {
    //   comp.partsMeta.forEach((meta, i) => {
    //     if (meta.kind === "event") {
    //       const token = meta.token;
    //       const selector = `[${meta.name}="${token}"], [${meta.name}='${token}']`;
    //       const matches = comp.frag.querySelectorAll(selector);

    //       matches.forEach((el) => {
    //         el.removeAttribute(meta.name);

    //         const handler = comp.parts[i];

    //         if (typeof handler !== "function") return;

    //         const listener = function (ev) {
    //           try {
    //             handler(ev);
    //           } catch (e) {
    //             console.error(e);
    //           }
    //         };

    //         console.log(meta.name.slice(2));

    //         el.addEventListener(meta.name.slice(2), listener);

    //         // cleanups.push(() =>
    //         //   // el.removeEventListener(meta.name.slice(2), listener),
    //         // );
    //       });
    //     }
    //   });
    // }

    // Scan and apply directives efficiently
    scanDirectives(firstElement);
  }
});

/**
 * Efficiently scans and applies directives to an element tree
 * @param {Element} root - Root element to scan
 */
function scanDirectives(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      // Check for nix- attributes using hasAttribute for better performance
      for (const attr of node.attributes) {
        if (attr.name.startsWith("nix-")) {
          return NodeFilter.FILTER_ACCEPT;
        }
      }
      return NodeFilter.FILTER_SKIP;
    },
  });

  let node;

  while ((node = walker.nextNode())) {
    directivesScanner(node);
  }
}
