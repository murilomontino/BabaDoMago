import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { matchClockFlushRequested } from "@/store/match-clock/actions";

export function useFlushMatchClock(matchId: number | null): void {
	const dispatch = useAppDispatch();

	useEffect(() => {
		if (matchId === null) {
			return;
		}

		dispatch(matchClockFlushRequested({ matchId }));
	}, [dispatch, matchId]);
}
