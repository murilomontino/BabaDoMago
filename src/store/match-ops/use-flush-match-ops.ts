import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { matchOpsFlushRequested } from "@/store/match-ops/actions";

export function useFlushMatchOps(eventId: number | null): void {
	const dispatch = useAppDispatch();

	useEffect(() => {
		if (eventId === null) {
			return;
		}

		dispatch(matchOpsFlushRequested({ eventId }));
	}, [dispatch, eventId]);
}
