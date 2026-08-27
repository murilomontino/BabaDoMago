export const TAB_PANEL = {
	enter: "animate-tab-panel motion-reduce:animate-none",
} as const;

export type TabPanelMode = "visible" | "hidden";

export function tabPanelMode(isActive: boolean): TabPanelMode {
	if (isActive) {
		return "visible";
	}

	return "hidden";
}
