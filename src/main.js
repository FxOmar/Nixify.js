import "./style.css";
import { $state, watchEffect } from "./reactivity";

const todos = $state([1, 2, 3]);
// const list = $state([1, 2, 3]);

// console.log("Todos changed:", todos.value);

watchEffect(() => {
  console.log("Todos changed:", todos.value);
  // console.log("List changed:", list.value);
  // processXAttributes(todos.value);
}, true);

// Check if element is inside an x-for template
function isInsideXForTemplate(element) {
  let parent = element.parentElement;

  while (parent) {
    if (parent.hasAttribute("x-for-container")) {
      return true;
    }
    parent = parent.parentElement;
  }

  return false;
}

function evaluateExpression(expr, context) {
  try {
    // Create function with context variables
    const keys = Object.keys(context);
    const values = Object.values(context);
    const func = new Function(...keys, `return ${expr}`);
    return func(...values);
  } catch (e) {
    console.error(`Error evaluating expression "${expr}":`, e);
    return "";
  }
}

function findElementsWithAttributeQuery(attributeName) {
  return Array.from(document.body.querySelectorAll(`${attributeName}`));
}

function processXAttributes(data = {}) {
  // Process x-for FIRST (before other attributes)
  processXFor(data);

  // Process x-text
  findElementsWithAttributeQuery("[x-text]").forEach((el) => {
    if (isInsideXForTemplate(el)) return;

    console.log("Processing x-text for element:", el);

    const expr = el.getAttribute("x-text");
    el.textContent = evaluateExpression(expr, data);
  });
}

function processXFor(data = {}) {
  findElementsWithAttributeQuery("[x-for]").forEach((template) => {
    const forExpression = template.getAttribute("x-for");

    // Parse expression like "item in items" or "(item, index) in items"
    const match = forExpression.match(
      /^(?:\((\w+)(?:,\s*(\w+))?\)|(\w+))\s+in\s+(\w+)$/,
    );

    if (!match) {
      console.error(`Invalid x-for expression: ${forExpression}`);
      return;
    }

    const itemName = match[1] || match[3]; // item variable name
    const indexName = match[2]; // optional index variable
    const arrayName = match[4]; // array name

    if (!template || !template.hasAttribute("x-for-container")) {
      template.setAttribute("x-for-container", arrayName);
    }

    const items = data[arrayName] || data || [];

    template.removeAttribute("x-for");

    items.forEach((item, index) => {
      // console.log("Cloning template for item:", item);

      const clone = template.children[0].cloneNode(true);

      // Create context with item and optional index
      const context = { [itemName]: item };

      if (typeof data === "object" && !Array.isArray(data)) {
        Object.assign(context, data);
      }

      if (indexName) {
        context[indexName] = index;
      }

      processElement(clone, context);

      template.appendChild(clone);
    });
  });
}

function processElement(element, context) {
  // Process x-text in clone
  if (element.hasAttribute("x-text")) {
    const expr = element.getAttribute("x-text");
    element.textContent = evaluateExpression(expr, context);
    element.removeAttribute("x-text"); // Remove after processing
  }
}

window.addEventListener("DOMContentLoaded", () => {
  processXAttributes(todos.value);
});

document.querySelector("button").addEventListener("click", () => {
  todos.value.push(Math.random());

  // list.value.push(Math.random());
});
