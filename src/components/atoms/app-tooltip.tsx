import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import { TOOLTIP_ENABLED_QUERY, TOOLTIP_ID } from "@/const/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";

export function AppTooltip() {
	const enabled = useMediaQuery(TOOLTIP_ENABLED_QUERY);

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
