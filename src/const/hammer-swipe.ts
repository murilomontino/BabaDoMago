export const HAMMER_VERTICAL_SWIPE = {
	threshold: 40,
	velocity: 0.15,
} as const;

export const VERTICAL_SWIPE_DIRECTION = {
	up: "up",
	down: "down",
} as const;

export type VerticalSwipeDirection =
	(typeof VERTICAL_SWIPE_DIRECTION)[keyof typeof VERTICAL_SWIPE_DIRECTION];

export const DRAWER_CLOSE_LABEL = "Fechar" as const;

export function verticalSwipeFromDelta(
	deltaY: number,
	threshold: number,
): VerticalSwipeDirection | null {
	if (deltaY <= -threshold) {
		return VERTICAL_SWIPE_DIRECTION.up;
	}

	if (deltaY >= threshold) {
		return VERTICAL_SWIPE_DIRECTION.down;
	}

	return null;
}
