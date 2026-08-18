export function shouldHoldWakeLock(
	hasOpenMatch: boolean,
	isVisible: boolean,
): boolean {
	return hasOpenMatch && isVisible;
}
