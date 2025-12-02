import { mount } from "./mount.js";
import { defineComponents, createComponent } from "./components.js";
import { directive } from "./directives.js";
import { exposeVar } from "./expose.js";

export function createApp() {
  return {
    mount,
    defineComponents,
    expose: exposeVar,
    directive,
    createComponent,
  };
}
