import { ListOrdered } from "lucide-react";
import { useState } from "react";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import {
	EVENT_MATCH_CLOCK_LABEL,
	MATCH_CLOCK_DEBUG_ENV,
	MATCH_CLOCK_DEBUG_LABEL,
} from "@/const/championship-event-match";
import { BUTTON_VARIANT, MODAL_CLASS } from "@/const/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	selectMatchClockError,
	selectMatchClockFlushAttempt,
	selectMatchClockHeld,
	selectMatchClockSnapshot,
} from "@/store/match-clock/selectors";
import { holdSet } from "@/store/match-clock/slice";

type MatchClockDebugProps = {
	matchId: number;
};

export function isMatchClockDebugVisible(): boolean {
	return (
		import.meta.env.DEV &&
		import.meta.env.VITE_MATCH_CLOCK_DEBUG === MATCH_CLOCK_DEBUG_ENV.on
	);
}

function clockField(value: string | number | null): string {
	if (value === null) {
		return "null";
	}

	return String(value);
}

export function MatchClockDebug({ matchId }: MatchClockDebugProps) {
	const [open, setOpen] = useState(false);
	const dispatch = useAppDispatch();
	const held = useAppSelector(selectMatchClockHeld);
	const error = useAppSelector(selectMatchClockError);
	const flushAttempt = useAppSelector(selectMatchClockFlushAttempt);
	const snapshot = useAppSelector((state) =>
		selectMatchClockSnapshot(state, matchId),
	);
	const pending = snapshot?.pending ?? [];

	function close() {
		setOpen(false);
	}

	function toggleHold() {
		dispatch(holdSet({ held: !held, matchId }));
	}

	return (
		<>
			<button
				type="button"
				aria-label={MATCH_CLOCK_DEBUG_LABEL.open}
				className="fixed right-3 bottom-20 z-50 inline-flex size-12 items-center justify-center rounded-full border border-line bg-surface text-fg shadow-md"
				onClick={() => {
					setOpen(true);
				}}
			>
				<ListOrdered className="size-5" />
			</button>
			{open && (
				<AppDialog onClose={close}>
					<div className={MODAL_CLASS}>
						<h2 className="mb-3 text-lg font-semibold tracking-tight text-fg">
							{MATCH_CLOCK_DEBUG_LABEL.title}
						</h2>
						<dl className="mb-3 space-y-1 text-xs text-fg-muted">
							<div>
								<dt className="font-medium text-fg">
									{MATCH_CLOCK_DEBUG_LABEL.startedAt}
								</dt>
								<dd className="break-all">
									{clockField(snapshot?.started_at ?? null)}
								</dd>
							</div>
							<div>
								<dt className="font-medium text-fg">
									{MATCH_CLOCK_DEBUG_LABEL.pausedAt}
								</dt>
								<dd className="break-all">
									{clockField(snapshot?.paused_at ?? null)}
								</dd>
							</div>
							<div>
								<dt className="font-medium text-fg">
									{MATCH_CLOCK_DEBUG_LABEL.accumulated}
								</dt>
								<dd>{clockField(snapshot?.pause_accumulated_seconds ?? 0)}</dd>
							</div>
							{error && (
								<div>
									<dt className="font-medium text-fg">
										{MATCH_CLOCK_DEBUG_LABEL.error}
									</dt>
									<dd className="break-all">{error}</dd>
								</div>
							)}
							{flushAttempt > 0 && (
								<div>
									<dt className="font-medium text-fg">
										{MATCH_CLOCK_DEBUG_LABEL.attempt}
									</dt>
									<dd>{flushAttempt}</dd>
								</div>
							)}
						</dl>
						<p className="mb-1 text-xs font-medium text-fg">
							{MATCH_CLOCK_DEBUG_LABEL.pending}
						</p>
						{pending.length === 0 && (
							<p className="mb-3 text-sm text-fg-muted">
								{MATCH_CLOCK_DEBUG_LABEL.empty}
							</p>
						)}
						{pending.length > 0 && (
							<p className="mb-3 text-sm text-fg">
								{pending
									.map((action) => EVENT_MATCH_CLOCK_LABEL[action])
									.join(" → ")}
							</p>
						)}
						<div className="flex justify-end gap-2">
							{held && (
								<Button variant={BUTTON_VARIANT.danger} onClick={toggleHold}>
									{MATCH_CLOCK_DEBUG_LABEL.release}
								</Button>
							)}
							{!held && (
								<Button variant={BUTTON_VARIANT.secondary} onClick={toggleHold}>
									{MATCH_CLOCK_DEBUG_LABEL.hold}
								</Button>
							)}
							<Button variant={BUTTON_VARIANT.secondary} onClick={close}>
								{MATCH_CLOCK_DEBUG_LABEL.close}
							</Button>
						</div>
					</div>
				</AppDialog>
			)}
		</>
	);
}
