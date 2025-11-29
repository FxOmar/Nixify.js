import { directive } from "./core.js";
import { cleanupEffect } from "../../reactivity.js";

directive("text", (el, { expression }, helpers) => {
  const run = () => {
    const v = helpers.evaluate(expression);

    el.textContent = v == null ? "" : "" + v;
  };

  const runner = helpers.effect(run);

  helpers.cleanup(() => cleanupEffect(runner));
});
