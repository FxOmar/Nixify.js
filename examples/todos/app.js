import { createApp } from "../../src/index.js";
import { createModel } from "./model.js";
import { createTodoUI } from "./ui.js";

const app = createApp();

const model = createModel();

const UI = createTodoUI(app, model);

app.mount(UI, document.getElementById("app"));
