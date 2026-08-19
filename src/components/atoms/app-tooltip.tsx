import { useSyncExternalStore } from "react";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import { TOOLTIP_ENABLED_QUERY, TOOLTIP_ID } from "@/const/tooltip";

function subscribeTooltipEnabled(onStoreChange: () => void) {
	const media = window.matchMedia(TOOLTIP_ENABLED_QUERY);
	media.addEventListener("change", onStoreChange);
	return () => media.removeEventListener("change", onStoreChange);
}

function getTooltipEnabled() {
	return window.matchMedia(TOOLTIP_ENABLED_QUERY).matches;
}

export function AppTooltip() {
	const enabled = useSyncExternalStore(
		subscribeTooltipEnabled,
		getTooltipEnabled,
		() => false,
	);

	return (
		<Tooltip
			id={TOOLTIP_ID}
			hidden={!enabled}
			style={{
				backgroundColor: "var(--color-fg)",
				color: "var(--color-surface)",
			}}
		/>
	);
}
