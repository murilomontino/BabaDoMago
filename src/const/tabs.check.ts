import { TAB_PANEL, tabPanelMode } from "./tabs.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(TAB_PANEL.enter.includes("animate-tab-panel"), "panel fades on enter");
check(
	TAB_PANEL.enter.includes("motion-reduce"),
	"panel respects motion reduce",
);
check(tabPanelMode(true) === "visible", "active panel visible");
check(tabPanelMode(false) === "hidden", "inactive panel hidden");

console.log("tabs ok");
