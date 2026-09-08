import { useMemo } from "react";
import { SectionCard } from "@/components/section-card";
import { PLAYER_RATING } from "@/const/player-rating";
import {
	calculatePlayerRatingAlignment,
	formatRatingAlignmentGap,
	formatRatingAlignmentIndex,
	formatRatingAlignmentRating,
	PLAYER_RATING_ALIGNMENT_LABEL,
	type PlayerRatingAlignment,
	RATING_ALIGNMENT_EVIDENCE_LEVEL,
	RATING_ALIGNMENT_PERSISTENCE,
	RATING_ALIGNMENT_STATUS,
	ratingAlignmentEvidenceLabel,
	ratingAlignmentFactorRows,
	ratingAlignmentStatusLabel,
} from "@/const/player-rating-alignment";
import type { ChampionshipPlayer } from "@/types/championship";
import type { ChampionshipEvent } from "@/types/championship-event";

type ChampionshipPlayerRatingAlignmentCardProps = {
	player: ChampionshipPlayer;
	players: readonly ChampionshipPlayer[];
	events: readonly ChampionshipEvent[];
};

function statusToneClass(row: PlayerRatingAlignment): string {
	switch (row.status) {
		case RATING_ALIGNMENT_STATUS.below_performance:
			return "text-pitch-fg";
		case RATING_ALIGNMENT_STATUS.slightly_below:
			return "text-pitch-fg";
		case RATING_ALIGNMENT_STATUS.aligned:
			return "text-fg-muted";
		case RATING_ALIGNMENT_STATUS.slightly_above:
			return "text-danger-fg";
		case RATING_ALIGNMENT_STATUS.above_performance:
			return "text-danger-fg";
		default: {
			const _never: never = row.status;
			return _never;
		}
	}
}

function FactorBar({ label, score }: { label: string; score: number | null }) {
	if (score === null) {
		return null;
	}

	const width = Math.max(0, Math.min(100, score));

	return (
		<div className="space-y-1">
			<div className="flex items-center justify-between gap-2 text-xs">
				<span className="text-fg-muted">{label}</span>
				<span className="tabular-nums text-fg">{Math.round(score)}</span>
			</div>
			<div className="h-2 overflow-hidden rounded-full bg-surface-muted">
				<div
					className="h-full rounded-full bg-pitch"
					style={{ width: `${width}%` }}
				/>
			</div>
		</div>
	);
}

function AlignmentBody({ row }: { row: PlayerRatingAlignment }) {
	if (
		row.evidence === RATING_ALIGNMENT_EVIDENCE_LEVEL.insufficient ||
		row.performanceIndex === null
	) {
		return (
			<p className="text-sm text-fg-muted">
				{PLAYER_RATING_ALIGNMENT_LABEL.noEvidence}
			</p>
		);
	}

	const factors = ratingAlignmentFactorRows(row);

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-3">
				<div>
					<p className="text-xs font-medium text-fg-muted">
						{PLAYER_RATING_ALIGNMENT_LABEL.current}
					</p>
					<p className="text-lg font-semibold tabular-nums text-fg">
						{formatRatingAlignmentRating(row.currentRating)}
					</p>
				</div>
				<div>
					<p className="text-xs font-medium text-fg-muted">
						{PLAYER_RATING_ALIGNMENT_LABEL.expected}
					</p>
					<p className="text-lg font-semibold tabular-nums text-fg">
						{formatRatingAlignmentRating(row.expectedRating)}
					</p>
				</div>
				<div>
					<p className="text-xs font-medium text-fg-muted">
						{PLAYER_RATING_ALIGNMENT_LABEL.gap}
					</p>
					<p className="text-lg font-semibold tabular-nums text-fg">
						{formatRatingAlignmentGap(row.ratingGap)}
					</p>
				</div>
				<div>
					<p className="text-xs font-medium text-fg-muted">
						{PLAYER_RATING_ALIGNMENT_LABEL.performanceIndex}
					</p>
					<p className="text-lg font-semibold tabular-nums text-fg">
						{formatRatingAlignmentIndex(row.performanceIndex)}
					</p>
				</div>
			</div>

			<p className={`text-sm font-medium ${statusToneClass(row)}`}>
				{ratingAlignmentStatusLabel(row.status)}
			</p>

			<div className="flex flex-wrap gap-3 text-xs text-fg-muted">
				<span>
					{PLAYER_RATING_ALIGNMENT_LABEL.games}: {row.games}
				</span>
				<span>
					{PLAYER_RATING_ALIGNMENT_LABEL.evidence}:{" "}
					{ratingAlignmentEvidenceLabel(row.evidence)}
				</span>
				{row.persistence !== RATING_ALIGNMENT_PERSISTENCE.normal && (
					<span>{PLAYER_RATING_ALIGNMENT_LABEL[row.persistence]}</span>
				)}
			</div>

			<div className="space-y-2">
				<p className="text-xs font-medium text-fg-muted">
					{PLAYER_RATING_ALIGNMENT_LABEL.factors}
				</p>
				{factors.map((factor) => (
					<FactorBar
						key={factor.id}
						label={factor.label}
						score={factor.score}
					/>
				))}
			</div>

			<p className="text-xs text-fg-muted">
				{PLAYER_RATING_ALIGNMENT_LABEL.defenseContext}
			</p>
		</div>
	);
}

export function ChampionshipPlayerRatingAlignmentCard({
	player,
	players,
	events,
}: ChampionshipPlayerRatingAlignmentCardProps) {
	const row = useMemo(
		() => calculatePlayerRatingAlignment(players, events, player.id),
		[players, events, player.id],
	);

	if (!row) {
		return null;
	}

	if (player.rating === PLAYER_RATING.default) {
		return (
			<SectionCard title={PLAYER_RATING_ALIGNMENT_LABEL.title}>
				<p className="text-sm text-fg-muted">
					{PLAYER_RATING_ALIGNMENT_LABEL.sentinel}
				</p>
			</SectionCard>
		);
	}

	return (
		<SectionCard title={PLAYER_RATING_ALIGNMENT_LABEL.title}>
			<p className="mb-3 text-sm text-fg-muted">
				{PLAYER_RATING_ALIGNMENT_LABEL.hint}
			</p>
			<AlignmentBody row={row} />
		</SectionCard>
	);
}
