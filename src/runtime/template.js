let tplIdCounter = 0;

const RE_EVENT = /(?:\s)(on[a-zA-Z]+)\s*=\s*["']?$/;
const RE_SELF_CLOSING = /<([A-Z][\w-]*)\s*\/>/g;

/**
 * Processes a template literal into a DocumentFragment with metadata for dynamic parts.
 *
 * @param {TemplateStringsArray} strings - The static strings of the template literal.
 * @param  {...any} parts - The dynamic parts of the template literal.
 * @returns {Object} An object containing the DocumentFragment, parts, partsMeta, and tplId.
 */
export function template(strings, ...parts) {
  const partsMeta = [];
  const out = [];
  const tplId = ++tplIdCounter;

  for (let i = 0; i < strings.length; i++) {
    const s = strings[i];

    out.push(s);

    if (i < parts.length) {
      const ev = RE_EVENT.exec(s);

      if (ev) {
        const evtName = ev[1];
        const token = `__nix_evt_${i}__`;

        out.push(token);

        partsMeta.push({ kind: "event", name: evtName, token });
      }
    }
  }

  let html = out.join("");

  html = html.replace(RE_SELF_CLOSING, "<$1></$1>");

  const tpl = document.createElement("template");

  tpl.innerHTML = html;

  const frag = tpl.content;

  return { frag, parts, partsMeta, tplId };
}
