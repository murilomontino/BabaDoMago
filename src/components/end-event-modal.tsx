import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { EVENT_TEAM_POSITION_CHIP_CLASS } from "@/components/event-team-player";
import { PlayerRating } from "@/components/player-rating";
import { EVENT_END_LABEL } from "@/const/championship-event";
import { EVENT_MVP_LABEL, formatEventMvpCount } from "@/const/event-mvp";
import {
	type EventRatingPreviewRow,
	formatEventRating,
} from "@/const/event-rating-adjustment";
import { PLAYER_STAR_CLASS } from "@/const/player-rating";
import { BUTTON_VARIANT, CHIP_CLASS, ERROR_CLASS } from "@/const/ui";

type EndEventModalProps = {
	rows: readonly EventRatingPreviewRow[];
	ceiling: number;
	canSetMvp: boolean;
	mvpCandidateIds: readonly number[];
	isPending: boolean;
	errorMessage: string | null;
	onToggleMvp: (playerId: number) => void;
	onCancel: () => void;
	onConfirm: () => void;
};

function RatingSnapshot({
	rating,
	ceiling,
}: {
	rating: number;
	ceiling: number;
}) {
	return (
		<div className="flex min-w-0 items-center gap-1">
			<PlayerRating
				rating={rating}
				ceiling={ceiling}
				starClassName={PLAYER_STAR_CLASS.compact}
			/>
			<span className={CHIP_CLASS}>{formatEventRating(rating)}</span>
		</div>
	);
}

function EndEventPreviewCardBody({
	row,
	ceiling,
}: {
	row: EventRatingPreviewRow;
	ceiling: number;
}) {
	return (
		<>
			<div className="flex min-w-0 items-center gap-1">
				<p className="min-w-0 truncate text-sm font-medium text-fg">
					{row.name}
				</p>
				{row.isMvp && (
					<span className={`${EVENT_TEAM_POSITION_CHIP_CLASS} shrink-0`}>
						{EVENT_MVP_LABEL.badge}
					</span>
				)}
			</div>
			<div className="mt-1 flex flex-nowrap items-center gap-1 overflow-hidden">
				<RatingSnapshot rating={row.from} ceiling={ceiling} />
				<span className="text-xs font-bold text-fg">→</span>
				<RatingSnapshot rating={row.to} ceiling={ceiling} />
			</div>
		</>
	);
}

function EndEventPreviewCard({
	row,
	ceiling,
	canToggleMvp,
	isPending,
	onToggleMvp,
}: {
	row: EventRatingPreviewRow;
	ceiling: number;
	canToggleMvp: boolean;
	isPending: boolean;
	onToggleMvp: (playerId: number) => void;
}) {
	const body = <EndEventPreviewCardBody row={row} ceiling={ceiling} />;

	if (!canToggleMvp) {
		return <li className="rounded-lg border border-line p-2">{body}</li>;
	}

	const borderClass = row.isMvp ? "border-pitch" : "border-line";

	return (
		<li>
			<button
				type="button"
				className={`w-full rounded-lg border p-2 text-left ${borderClass}`}
				disabled={isPending}
				onClick={() => {
					onToggleMvp(row.playerId);
				}}
			>
				{body}
			</button>
		</li>
	);
}

export function EndEventModal({
	rows,
	ceiling,
	canSetMvp,
	mvpCandidateIds,
	isPending,
	errorMessage,
	onToggleMvp,
	onCancel,
	onConfirm,
}: EndEventModalProps) {
	const candidateIds = new Set(mvpCandidateIds);
	const mvpCount = rows.filter((row) => row.isMvp).length;

	return (
		<AppDialog onClose={onCancel}>
			<div className="max-h-[90dvh] w-full max-w-5xl overflow-y-auto rounded-xl bg-surface p-4 shadow-lg">
				<p className="mb-1 text-sm font-medium tracking-tight text-fg">
					{EVENT_END_LABEL.title}
				</p>
				<p className="mb-3 text-sm text-fg-muted">{EVENT_END_LABEL.hint}</p>
				<p className="mb-3 text-sm text-fg-muted">{EVENT_MVP_LABEL.explain}</p>
				<p className="mb-3">
					<span className={CHIP_CLASS}>{formatEventMvpCount(mvpCount)}</span>
				</p>
				{canSetMvp && (
					<p className="mb-3 text-sm text-fg-muted">
						{EVENT_MVP_LABEL.toggleHint}
					</p>
				)}
				{rows.length > 0 && (
					<ul className="mb-3 grid grid-cols-3 gap-2">
						{rows.map((row) => (
							<EndEventPreviewCard
								key={row.playerId}
								row={row}
								ceiling={ceiling}
								canToggleMvp={canSetMvp && candidateIds.has(row.playerId)}
								isPending={isPending}
								onToggleMvp={onToggleMvp}
							/>
						))}
					</ul>
				)}
				{errorMessage && (
					<p className={`mb-2 ${ERROR_CLASS}`}>{errorMessage}</p>
				)}
				<div className="mt-4 flex justify-end gap-2">
					<Button
						variant={BUTTON_VARIANT.secondary}
						onClick={onCancel}
						disabled={isPending}
					>
						{EVENT_END_LABEL.cancel}
					</Button>
					<Button
						variant={BUTTON_VARIANT.danger}
						onClick={onConfirm}
						disabled={isPending}
					>
						{EVENT_END_LABEL.confirm}
					</Button>
				</div>
			</div>
		</AppDialog>
	);
}
