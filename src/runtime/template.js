let tplIdCounter = 0;

const RE_EVENT = /(?:\s)(on[a-zA-Z]+)\s*=\s*["']?$/;
const RE_FOR_ATTR = /(?:\s)(nix-for)\s*=\s*["']?(.*?\s+in\s+)$/;
const RE_FOR_SPEC_TUPLE = /^\(([^,\s]+)\s*(?:,\s*([^\s]+))?\)\s+in\s+$/;
const RE_FOR_SPEC_SINGLE = /^([^\s]+)\s+in\s+$/;
const RE_SELF_CLOSING = /<([A-Z][\w-]*)\s*\/>/g;

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
        partsMeta.push({ kind: 'event', name: evtName, token });
      } else {
        const fm = RE_FOR_ATTR.exec(s);
        if (fm) {
          const spec = fm[2].trim();
          let itemVar = 'item';
          let indexVar = null;
          const m =
            RE_FOR_SPEC_TUPLE.exec(spec) || RE_FOR_SPEC_SINGLE.exec(spec);
          if (m) {
            if (m[2]) {
              itemVar = m[1];
              indexVar = m[2];
            } else {
              itemVar = m[1];
            }
          }
          const token = `__nix_for_${i}__`;
          out.push(token);
          partsMeta.push({
            kind: 'for',
            token,
            itemsIndex: i,
            itemVar,
            indexVar,
          });
        } else {
          out.push(`<!--nix:${tplId}:${i}-->`);
          partsMeta.push({ kind: 'text', index: i });
        }
      }
    }
  }

  let html = out.join('');

  html = html.replace(RE_SELF_CLOSING, '<$1></$1>');

  const tpl = document.createElement('template');

  tpl.innerHTML = html;

  const frag = tpl.content;

  return { frag, parts, partsMeta, tplId };
}
