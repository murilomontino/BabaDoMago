import { ListOrdered } from "lucide-react";
import { useState } from "react";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import {
	MATCH_CLOCK_DEBUG_LABEL,
	matchClockDebugEnabled,
	matchClockDebugOnlineLabel,
	matchClockDebugQueueItemLabel,
} from "@/const/championship-event-match";
import {
	MATCH_OPS_LABEL,
	matchOpDebugLabel,
} from "@/const/championship-event-match-ops";
import { BUTTON_VARIANT, MODAL_CLASS, SAFE_AREA_FAB_CLASS } from "@/const/ui";
import { useOnline } from "@/hooks/use-online";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	selectMatchClockDeferredClear,
	selectMatchClockError,
	selectMatchClockFlushAttempt,
	selectMatchClockHeld,
	selectMatchClockSnapshot,
} from "@/store/match-clock/selectors";
import { holdSet } from "@/store/match-clock/slice";
import {
	selectMatchOps,
	selectMatchOpsError,
	selectMatchOpsFlushAttempt,
} from "@/store/match-ops/selectors";

type MatchClockDebugProps = {
	matchId: number;
	eventId: number;
};

export function isMatchClockDebugVisible(): boolean {
	return matchClockDebugEnabled(
		import.meta.env.DEV,
		import.meta.env.VITE_MATCH_CLOCK_DEBUG,
	);
}

function clockField(value: string | number | null): string {
	if (value === null) {
		return "null";
	}

	return String(value);
}

export function MatchClockDebug({ matchId, eventId }: MatchClockDebugProps) {
	const [open, setOpen] = useState(false);
	const dispatch = useAppDispatch();
	const online = useOnline();
	const held = useAppSelector(selectMatchClockHeld);
	const error = useAppSelector(selectMatchClockError);
	const flushAttempt = useAppSelector(selectMatchClockFlushAttempt);
	const deferredClear = useAppSelector((state) =>
		selectMatchClockDeferredClear(state, matchId),
	);
	const snapshot = useAppSelector((state) =>
		selectMatchClockSnapshot(state, matchId),
	);
	const pending = snapshot?.pending ?? [];
	const matchOps = useAppSelector((state) => selectMatchOps(state, eventId));
	const opsError = useAppSelector(selectMatchOpsError);
	const opsFlushAttempt = useAppSelector(selectMatchOpsFlushAttempt);
	const pendingCount = pending.length + matchOps.length;

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
				className={`relative fixed z-[60] inline-flex size-12 items-center justify-center rounded-full border border-line bg-surface text-fg shadow-md ${SAFE_AREA_FAB_CLASS}`}
				onClick={() => {
					setOpen(true);
				}}
			>
				<ListOrdered className="size-5" />
				{pendingCount > 0 && (
					<span className="absolute -top-1 -right-1 min-w-5 rounded-full bg-danger px-1 text-center text-[10px] font-semibold text-danger-fg">
						{pendingCount}
					</span>
				)}
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
									{MATCH_CLOCK_DEBUG_LABEL.network}
								</dt>
								<dd>{matchClockDebugOnlineLabel(online)}</dd>
							</div>
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
							<div>
								<dt className="font-medium text-fg">
									{MATCH_CLOCK_DEBUG_LABEL.count}
								</dt>
								<dd>{pending.length}</dd>
							</div>
							{deferredClear && (
								<div>
									<dt className="font-medium text-fg">
										{MATCH_CLOCK_DEBUG_LABEL.deferred}
									</dt>
									<dd>{MATCH_CLOCK_DEBUG_LABEL.yes}</dd>
								</div>
							)}
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
							<p className="mb-3 whitespace-pre-line text-sm text-fg">
								{pending
									.map((action, index) =>
										matchClockDebugQueueItemLabel(action, index),
									)
									.join("\n")}
							</p>
						)}
						<p className="mb-1 text-xs font-medium text-fg">
							{MATCH_OPS_LABEL.queue}
						</p>
						<div className="mb-3 space-y-1 text-xs text-fg-muted">
							<div>
								<dt className="font-medium text-fg">
									{MATCH_CLOCK_DEBUG_LABEL.count}
								</dt>
								<dd>{matchOps.length}</dd>
							</div>
							{opsError && (
								<div>
									<dt className="font-medium text-fg">
										{MATCH_CLOCK_DEBUG_LABEL.error}
									</dt>
									<dd className="break-all">{opsError}</dd>
								</div>
							)}
							{opsFlushAttempt > 0 && (
								<div>
									<dt className="font-medium text-fg">
										{MATCH_CLOCK_DEBUG_LABEL.attempt}
									</dt>
									<dd>{opsFlushAttempt}</dd>
								</div>
							)}
						</div>
						{matchOps.length === 0 && (
							<p className="mb-3 text-sm text-fg-muted">
								{MATCH_CLOCK_DEBUG_LABEL.empty}
							</p>
						)}
						{matchOps.length > 0 && (
							<p className="mb-3 whitespace-pre-line text-sm text-fg">
								{matchOps
									.map((op, index) => matchOpDebugLabel(op, index))
									.join("\n")}
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
