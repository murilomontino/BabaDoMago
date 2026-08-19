import { TOOLTIP_ENABLED_QUERY, TOOLTIP_ID } from "./tooltip.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(TOOLTIP_ID === "app-tooltip", "tooltip id");
check(TOOLTIP_ENABLED_QUERY === "(min-width: 768px)", "md breakpoint");
check(TOOLTIP_ENABLED_QUERY.includes("768px"), "matches tailwind md");

console.log("tooltip ok");
