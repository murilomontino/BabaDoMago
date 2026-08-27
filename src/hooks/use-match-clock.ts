import { useEffect, useState } from "react";
import {
	type MatchClockFields,
	matchClockElapsedSeconds,
	matchClockNowMs,
} from "@/const/championship-event-match";

export function useMatchClock(match: MatchClockFields | null): number {
	const [nowMs, setNowMs] = useState(() => Date.now());
	const ticking =
		match !== null &&
		match.started_at !== null &&
		match.ended_at === null &&
		match.paused_at === null;

	useEffect(() => {
		if (!ticking) {
			return;
		}

		setNowMs(Date.now());
		function resampleNow() {
			setNowMs(Date.now());
		}

		function onVisibility() {
			if (document.visibilityState !== "visible") {
				return;
			}

			resampleNow();
		}

		const id = setInterval(resampleNow, 250);
		window.addEventListener("pageshow", resampleNow);
		document.addEventListener("visibilitychange", onVisibility);
		return () => {
			clearInterval(id);
			window.removeEventListener("pageshow", resampleNow);
			document.removeEventListener("visibilitychange", onVisibility);
		};
	}, [ticking]);

	if (!match) {
		return 0;
	}

	return matchClockElapsedSeconds(match, matchClockNowMs(ticking, nowMs));
}
