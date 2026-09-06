import Hammer from "hammerjs";
import { type RefObject, useEffect, useEffectEvent } from "react";
import { HAMMER_VERTICAL_SWIPE } from "@/const/hammer-swipe";

type VerticalSwipeHandlers = {
	onSwipeUp?: () => void;
	onSwipeDown?: () => void;
};

function setupHammerVerticalSwipe(
	element: HTMLElement,
	handlers: VerticalSwipeHandlers,
) {
	const hammer = new Hammer(element);

	hammer.get("pan").set({
		direction: Hammer.DIRECTION_VERTICAL,
		threshold: HAMMER_VERTICAL_SWIPE.panThreshold,
	});
	hammer.get("swipe").set({
		direction: Hammer.DIRECTION_VERTICAL,
		threshold: HAMMER_VERTICAL_SWIPE.swipeThreshold,
		velocity: HAMMER_VERTICAL_SWIPE.velocity,
	});

	if (handlers.onSwipeUp) {
		hammer.on("swipeup", handlers.onSwipeUp);
	}

	if (handlers.onSwipeDown) {
		hammer.on("swipedown", handlers.onSwipeDown);
	}

	return () => {
		hammer.stop(false);
		hammer.destroy();
	};
}

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

		let cleanup: (() => void) | undefined;

		// Painel/overlay monta no frame seguinte (dialog + AnimatePresence).
		const frameId = requestAnimationFrame(() => {
			const node = targetRef.current;
			if (!node) {
				return;
			}

			cleanup = setupHammerVerticalSwipe(node, {
				onSwipeUp: () => {
					onSwipeUp();
				},
				onSwipeDown: () => {
					onSwipeDown();
				},
			});
		});

		return () => {
			cancelAnimationFrame(frameId);
			cleanup?.();
		};
	}, [enabled, targetRef]);
}
