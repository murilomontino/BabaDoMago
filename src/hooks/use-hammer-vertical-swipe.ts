import Hammer from "hammerjs";
import { type RefObject, useEffect, useEffectEvent } from "react";
import {
	HAMMER_VERTICAL_SWIPE,
	VERTICAL_SWIPE_DIRECTION,
	verticalSwipeFromDelta,
} from "@/const/hammer-swipe";

type VerticalSwipeHandlers = {
	onSwipeUp?: () => void;
	onSwipeDown?: () => void;
};

export function useHammerVerticalSwipe(
	targetRef: RefObject<HTMLElement | null>,
	handlers: VerticalSwipeHandlers,
	enabled = true,
) {
	const onSwipeUp = useEffectEvent(() => {
		handlers.onSwipeUp?.();
	});
	const onSwipeDown = useEffectEvent(() => {
		handlers.onSwipeDown?.();
	});

	useEffect(() => {
		if (!enabled) {
			return;
		}

		const node = targetRef.current;
		if (!node) {
			return;
		}

		// PointerEvent-only input ignores slow mouse drags as swipe;
		// TouchMouseInput keeps mouse pan reliable on desktop.
		const manager = new Hammer.Manager(node, {
			touchAction: "pan-y",
			inputClass: Hammer.TouchMouseInput,
		});

		manager.add(
			new Hammer.Pan({
				direction: Hammer.DIRECTION_VERTICAL,
				threshold: 0,
			}),
		);

		manager.on("panend", (event) => {
			const direction = verticalSwipeFromDelta(
				event.deltaY,
				HAMMER_VERTICAL_SWIPE.threshold,
			);
			if (direction === VERTICAL_SWIPE_DIRECTION.up) {
				onSwipeUp();
				return;
			}

			if (direction === VERTICAL_SWIPE_DIRECTION.down) {
				onSwipeDown();
			}
		});

		return () => {
			manager.destroy();
		};
	}, [enabled, targetRef]);
}
