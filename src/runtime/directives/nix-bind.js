import { directive } from "./core.js";
import { cleanupEffect } from "../../reactivity.js";
import { vars } from "../expose.js";

directive("bind", (el, { expression }, helpers) => {
  const raw = Array.from(el.attributes).find((a) => {
    if (a.name.startsWith("nix-bind:")) return true;
    if (/^:[a-zA-Z]+$/.test(a.name)) return true;

    return false;
  });

  if (!raw) return;

  const prop = raw.name.replace(/^nix-bind:/, "").replace(/^:/, "");

  const name = (expression || "").trim();

  const run = () => {
    const v = helpers.evaluate(name);
    console.log("nix-bind raw attribute:", raw, prop, v, name);

    if (!v) return;

    console.log("nix-bind:", { expression, name, v, el });

    el.setAttribute(prop, v);
  };

  const runner = helpers.effect(run);

  helpers.cleanup(() => cleanupEffect(runner));
});
