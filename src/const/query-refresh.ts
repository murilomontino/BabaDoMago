import { TOOLTIP_ENABLED_QUERY } from "./tooltip.ts";

export const QUERY_REFRESH = {
	mediaQuery: TOOLTIP_ENABLED_QUERY,
	pullThresholdPx: 64,
} as const;

export const QUERY_REFRESH_LABEL = {
	action: "Atualizar",
} as const;

export function listingScrollY(
	windowScrollY: number,
	listingScrollTop: number,
): number {
	return windowScrollY + listingScrollTop;
}

export function pullDeltaFromTouch(
	scrollY: number,
	startY: number,
	currentY: number,
): number {
	if (scrollY > 0) {
		return 0;
	}

	const delta = currentY - startY;
	if (delta <= 0) {
		return 0;
	}

	return delta;
}

export function shouldCommitQueryRefresh(
	pullPx: number,
	thresholdPx: number,
): boolean {
	return pullPx >= thresholdPx;
}

export function queryRefreshPullOffset(
	pullPx: number,
	pending: boolean,
	thresholdPx: number,
): number {
	if (pending) {
		return thresholdPx;
	}

	if (pullPx <= 0) {
		return 0;
	}

	if (pullPx < thresholdPx) {
		return pullPx;
	}

	return thresholdPx;
}
