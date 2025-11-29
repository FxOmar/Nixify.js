import { mount } from './mount.js';
import { define, createComponent } from './components.js';
import { directive } from './directives.js';

export function createApp() {
  return {
    mount,
    define,
    directive,
    createComponent,
  };
}
