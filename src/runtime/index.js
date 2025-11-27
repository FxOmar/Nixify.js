import { state, computed } from '../reactivity.js';
import { template } from './template.js';
import { mount } from './mount.js';
import { define, componentsScope } from './components.js';
import { directive } from './directives.js';
import { exposeScope } from './expose.js';

export function createApp() {
  return {
    state,
    computed,
    template,
    mount,
    define,
    directive,
    components: componentsScope,
    expose: exposeScope,
  };
}

export { template, mount, define, directive };
