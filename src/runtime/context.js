const nodeLocalVars = new WeakMap();

export function setNodeLocalVars(node, varsMap) {
  if (node && typeof node === 'object') nodeLocalVars.set(node, varsMap);
}

export function getNodeLocalVars(node) {
  return nodeLocalVars.get(node) || null;
}

export { nodeLocalVars };
