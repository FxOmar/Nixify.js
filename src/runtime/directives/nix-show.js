import { directive } from "./core.js";
import { cleanupEffect } from "../../reactivity.js";

directive("show", (el, { expression }, helpers) => {
  const run = () => {
    const v = helpers.evaluate(expression);
    el.style.display = v ? "" : "none";
  };
  const runner = helpers.effect(run);
  helpers.cleanup(() => cleanupEffect(runner));
});