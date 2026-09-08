import { AlertTriangle, TrendingDown } from "lucide-react";
import { playerVisibleName } from "@/const/player-name";
import {
	formatRatingAlignmentGap,
	formatRatingAlignmentRating,
	PLAYER_RATING_ALIGNMENT_LABEL,
	type PlayerRatingAlignment,
	RATING_ALIGNMENT_STATUS,
	ratingAlignmentEvidenceLabel,
} from "@/const/player-rating-alignment";
import type { ChampionshipPlayer } from "@/types/championship";

type ChampionshipDrawRatingAlignmentWarningProps = {
	warnings: readonly PlayerRatingAlignment[];
	players: readonly ChampionshipPlayer[];
};

function warningTitle(status: PlayerRatingAlignment["status"]): string {
	if (status === RATING_ALIGNMENT_STATUS.below_performance) {
		return PLAYER_RATING_ALIGNMENT_LABEL.drawWarningBelow;
	}
	return PLAYER_RATING_ALIGNMENT_LABEL.drawWarningAbove;
}

function warningCopy(status: PlayerRatingAlignment["status"]): string {
	if (status === RATING_ALIGNMENT_STATUS.below_performance) {
		return PLAYER_RATING_ALIGNMENT_LABEL.drawRecentAbove;
	}
	return PLAYER_RATING_ALIGNMENT_LABEL.drawRecentBelow;
}

export function ChampionshipDrawRatingAlignmentWarning({
	warnings,
	players,
}: ChampionshipDrawRatingAlignmentWarningProps) {
	if (warnings.length === 0) {
		return null;
	}

	const byId = new Map(players.map((player) => [player.id, player] as const));

	return (
		<div className="space-y-3 rounded-xl border border-line bg-surface px-4 py-3">
			{warnings.map((row) => {
				const player = byId.get(row.playerId);
				if (!player) {
					return null;
				}

				const Icon =
					row.status === RATING_ALIGNMENT_STATUS.below_performance
						? AlertTriangle
						: TrendingDown;

				return (
					<div key={row.playerId} className="space-y-1 text-sm">
						<div className="flex items-center gap-2 font-medium text-fg">
							<Icon className="size-4 shrink-0 text-pitch-fg" />
							<span>{warningTitle(row.status)}</span>
						</div>
						<p className="font-semibold text-fg">{playerVisibleName(player)}</p>
						<p className="text-fg-muted">
							{PLAYER_RATING_ALIGNMENT_LABEL.current}:{" "}
							{formatRatingAlignmentRating(row.currentRating)}
						</p>
						<p className="text-fg-muted">
							{PLAYER_RATING_ALIGNMENT_LABEL.expected}:{" "}
							{formatRatingAlignmentRating(row.expectedRating)}
						</p>
						<p className="text-fg-muted">{warningCopy(row.status)}</p>
						<p className="text-xs text-fg-muted">
							{PLAYER_RATING_ALIGNMENT_LABEL.evidence}: {row.games} ·{" "}
							{ratingAlignmentEvidenceLabel(row.evidence)}
							{" · "}
							{PLAYER_RATING_ALIGNMENT_LABEL.gap}:{" "}
							{formatRatingAlignmentGap(row.ratingGap)}
						</p>
					</div>
				);
			})}
		</div>
	);
}
