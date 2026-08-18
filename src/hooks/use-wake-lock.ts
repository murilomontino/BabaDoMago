import { useEffect } from "react";
import { shouldHoldWakeLock } from "@/const/wake-lock";

function canRequestWakeLock(): boolean {
	return typeof navigator !== "undefined" && "wakeLock" in navigator;
}

export function useWakeLock(hasOpenMatch: boolean): void {
	useEffect(() => {
		if (!hasOpenMatch || !canRequestWakeLock()) {
			return;
		}

		let cancelled = false;
		let sentinel: WakeLockSentinel | null = null;

		async function acquire() {
			if (cancelled) {
				return;
			}

			if (
				!shouldHoldWakeLock(
					hasOpenMatch,
					document.visibilityState === "visible",
				)
			) {
				return;
			}

			try {
				sentinel = await navigator.wakeLock.request("screen");
			} catch {
				return;
			}
		}

		async function release() {
			const current = sentinel;
			sentinel = null;
			if (!current) {
				return;
			}

			try {
				await current.release();
			} catch {
				return;
			}
		}

		function onVisibilityChange() {
			if (
				shouldHoldWakeLock(hasOpenMatch, document.visibilityState === "visible")
			) {
				void acquire();
				return;
			}

			void release();
		}

		void acquire();
		document.addEventListener("visibilitychange", onVisibilityChange);

		return () => {
			cancelled = true;
			document.removeEventListener("visibilitychange", onVisibilityChange);
			void release();
		};
	}, [hasOpenMatch]);
}
