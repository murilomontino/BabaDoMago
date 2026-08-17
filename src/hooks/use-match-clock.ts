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
		const id = setInterval(() => {
			setNowMs(Date.now());
		}, 250);
		return () => {
			clearInterval(id);
		};
	}, [ticking]);

	if (!match) {
		return 0;
	}

	return matchClockElapsedSeconds(match, matchClockNowMs(ticking, nowMs));
}
