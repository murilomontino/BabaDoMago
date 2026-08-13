import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import { TOOLTIP_ID } from "@/const/tooltip";

export function AppTooltip() {
	return <Tooltip id={TOOLTIP_ID} />;
}
