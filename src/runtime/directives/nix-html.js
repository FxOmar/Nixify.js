import { directive } from "./core.js";
import { cleanupEffect } from "../../reactivity.js";

directive("html", (el, { expression }, helpers) => {
  const run = () => {
    const v = helpers.evaluate(expression);
    console.log("html", v);
    el.innerHTML = v == null ? "" : "" + v;
  };
  const runner = helpers.effect(run);
  helpers.cleanup(() => cleanupEffect(runner));
});