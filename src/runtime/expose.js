export const vars = new Map();

export function exposeVar(localVars) {
  Object.entries(localVars).forEach(([k, v]) => {
    const getter =
      typeof v === "function"
        ? v
        : () => (v && typeof v === "object" && "value" in v ? v.value : v);

    vars.set(k, getter);
  });
}
