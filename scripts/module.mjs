import { registerSheetButton } from "./sheetButton.mjs";
import { registerSocketHandlers } from "./socket.mjs";

Hooks.once("init", () => {
	console.log("fallout-terminal | init");
});

Hooks.once("ready", () => {
	registerSocketHandlers();
	registerSheetButton();
});
