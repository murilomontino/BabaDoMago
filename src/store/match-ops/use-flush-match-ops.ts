import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { matchOpsFlushRequested } from "@/store/match-ops/actions";

export function useFlushMatchOps(matchId: number | null): void {
	const dispatch = useAppDispatch();

	useEffect(() => {
		if (matchId === null) {
			return;
		}

		dispatch(matchOpsFlushRequested({ matchId }));
	}, [dispatch, matchId]);
}
