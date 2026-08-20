import { LoaderCircle, Share2 } from "lucide-react";
import { useState } from "react";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { EVENT_TEAM_POSITION_CHIP_CLASS } from "@/components/event-team-player";
import { PlayerRating } from "@/components/player-rating";
import {
	EVENT_END_LABEL,
	EVENT_END_MISSING_ATTENDANCE_LABEL,
} from "@/const/championship-event";
import { EVENT_MVP_LABEL, formatEventMvpCount } from "@/const/event-mvp";
import {
	type EventRatingPreviewRow,
	formatEventRating,
} from "@/const/event-rating-adjustment";
import {
	EVENT_RECAP_SHARE_LABEL,
	type EventRecapShareRatingChange,
	eventRecapShareRatingChangesFromPreview,
} from "@/const/event-recap-share";
import { PLAYER_STAR_CLASS } from "@/const/player-rating";
import { BUTTON_VARIANT, CHIP_CLASS, ERROR_CLASS } from "@/const/ui";
import { shareEventRecapImage } from "@/lib/share-event-recap-image";
import type {
	ChampionshipEventMatch,
	ChampionshipEventTeam,
} from "@/types/championship-event";

type EndEventModalProps = {
	rows: readonly EventRatingPreviewRow[];
	ceiling: number;
	canSetMvp: boolean;
	mvpCandidateIds: readonly number[];
	missingAttendanceNames?: readonly string[];
	championshipName: string;
	startsAt: string;
	matches: readonly ChampionshipEventMatch[];
	teams: readonly ChampionshipEventTeam[];
	isPending: boolean;
	errorMessage: string | null;
	onToggleMvp: (playerId: number) => void;
	onCancel: () => void;
	onConfirm: () => Promise<void>;
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
			<p className="mt-1 flex items-center gap-1 md:hidden">
				<span className="text-xs font-medium tabular-nums">
					{formatEventRating(row.from)}
				</span>
				<span className="text-xs font-bold text-fg">→</span>
				<span className="text-xs font-medium tabular-nums">
					{formatEventRating(row.to)}
				</span>
			</p>
			<div className="mt-1 hidden flex-nowrap items-center gap-1 overflow-hidden md:flex">
				<RatingSnapshot rating={row.from} ceiling={ceiling} />
				<span className="text-xs font-bold text-fg">→</span>
				<RatingSnapshot rating={row.to} ceiling={ceiling} />
			</div>
		</>
	);
}

function mvpPreviewBorderClass(isMvp: boolean): string {
	if (isMvp) {
		return "border-pitch";
	}

	return "border-line";
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

	return (
		<li>
			<button
				type="button"
				className={`w-full rounded-lg border p-2 text-left ${mvpPreviewBorderClass(row.isMvp)}`}
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
	missingAttendanceNames = [],
	championshipName,
	startsAt,
	matches,
	teams,
	isPending,
	errorMessage,
	onToggleMvp,
	onCancel,
	onConfirm,
}: EndEventModalProps) {
	const [step, setStep] = useState<"confirm" | "share">("confirm");
	const [isSharing, setIsSharing] = useState(false);
	const [shareError, setShareError] = useState<string | null>(null);

	const candidateIds = new Set(mvpCandidateIds);
	const mvpCount = rows.filter((row) => row.isMvp).length;

	const ratingChanges: readonly EventRecapShareRatingChange[] =
		eventRecapShareRatingChangesFromPreview(rows);

	async function handleShare() {
		setIsSharing(true);
		setShareError(null);

		try {
			await shareEventRecapImage({
				championshipName,
				startsAt,
				matches,
				teams,
				ratingChanges,
			});
		} catch {
			setShareError(EVENT_RECAP_SHARE_LABEL.shareFailed);
		} finally {
			setIsSharing(false);
		}
	}

	return (
		<AppDialog onClose={onCancel}>
			<div className="max-h-[90dvh] w-full max-w-5xl overflow-y-auto rounded-xl bg-surface p-4 shadow-lg">
				{step === "share" ? (
					<>
						<p className="mb-1 text-sm font-medium tracking-tight text-fg">
							Recap após encerrar
						</p>
						<p className="mb-3 text-sm text-fg-muted">
							Recap da noite pronto para compartilhar.
						</p>
						{shareError && (
							<p className={`mb-2 ${ERROR_CLASS}`}>{shareError}</p>
						)}
						<div className="mt-4 flex justify-end gap-2">
							<Button
								variant={BUTTON_VARIANT.secondary}
								onClick={onCancel}
								disabled={isSharing}
							>
								Fechar
							</Button>
							<Button
								variant={BUTTON_VARIANT.primary}
								onClick={() => {
									void handleShare();
								}}
								disabled={isSharing}
							>
								{isSharing ? (
									<LoaderCircle className="size-4 animate-spin" />
								) : (
									<Share2 className="size-4" />
								)}
								<span className="ml-2">{EVENT_RECAP_SHARE_LABEL.share}</span>
							</Button>
						</div>
					</>
				) : (
					<>
						<p className="mb-1 text-sm font-medium tracking-tight text-fg">
							{EVENT_END_LABEL.title}
						</p>
						<p className="mb-3 text-sm text-fg-muted">{EVENT_END_LABEL.hint}</p>
						{missingAttendanceNames.length > 0 && (
							<p className="mb-3 text-sm text-fg-muted">
								{EVENT_END_MISSING_ATTENDANCE_LABEL.hint}{" "}
								{missingAttendanceNames.join(", ")}
							</p>
						)}
						<p className="mb-3 text-sm text-fg-muted">
							{EVENT_MVP_LABEL.explain}
						</p>
						<p className="mb-3">
							<span className={CHIP_CLASS}>
								{formatEventMvpCount(mvpCount)}
							</span>
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
								onClick={() => {
									void (async () => {
										try {
											await onConfirm();
											setStep("share");
										} catch {
											return;
										}
									})();
								}}
								disabled={isPending}
							>
								{EVENT_END_LABEL.confirm}
							</Button>
						</div>
					</>
				)}
			</div>
		</AppDialog>
	);
}
