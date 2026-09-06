import type { ChampionshipPlayer } from "../types/championship.ts";
import {
	hiddenStrengthChampionshipCeiling,
	hiddenStrengthSeed,
} from "./hidden-strength.ts";
import { playerVisibleName } from "./player-name.ts";
import { PLAYER_RATING } from "./player-rating.ts";
import { formatRosterAverage } from "./roster-stats.ts";

export const RATING_GAP_LABEL = {
	title: "Gap pública × oculta",
	empty: "Nenhum jogador com nota oculta",
	hint: "Oculta atual versus rescale da estrela. Gap alto = estrela errada.",
	publicSeed: "Rescale",
	hidden: "Oculta",
	gap: "Gap",
	underrated: "Subvalorizado",
	overrated: "Supervalorizado",
} as const;

export const RATING_GAP_KIND = {
	underrated: "underrated",
	overrated: "overrated",
	even: "even",
} as const;

export type RatingGapKind =
	(typeof RATING_GAP_KIND)[keyof typeof RATING_GAP_KIND];

export type RatingGapRow = {
	player: ChampionshipPlayer;
	publicSeed: number;
	hidden: number;
	gap: number;
	kind: RatingGapKind;
};

function gapKind(gap: number): RatingGapKind {
	if (gap > 0) {
		return RATING_GAP_KIND.underrated;
	}

	if (gap < 0) {
		return RATING_GAP_KIND.overrated;
	}

	return RATING_GAP_KIND.even;
}

export function championshipRatingGap(
	players: readonly ChampionshipPlayer[],
): RatingGapRow[] {
	const ceiling = hiddenStrengthChampionshipCeiling(players);
	const rows = players.flatMap((player) => {
		if (player.deleted_at !== null) {
			return [];
		}

		const hidden = player.hidden_strength ?? PLAYER_RATING.default;
		if (hidden === PLAYER_RATING.default) {
			return [];
		}

		const publicSeed = hiddenStrengthSeed(player.rating, ceiling);
		if (publicSeed === PLAYER_RATING.default) {
			return [];
		}

		const gap = Math.round((hidden - publicSeed) * 10) / 10;
		return [
			{
				player,
				publicSeed,
				hidden,
				gap,
				kind: gapKind(gap),
			},
		];
	});

	return rows.sort((left, right) => {
		const leftAbs = Math.abs(left.gap);
		const rightAbs = Math.abs(right.gap);
		if (rightAbs !== leftAbs) {
			return rightAbs - leftAbs;
		}

		return playerVisibleName(left.player).localeCompare(
			playerVisibleName(right.player),
			"pt",
		);
	});
}

export function ratingGapKindLabel(kind: RatingGapKind): string {
	switch (kind) {
		case RATING_GAP_KIND.underrated:
			return RATING_GAP_LABEL.underrated;
		case RATING_GAP_KIND.overrated:
			return RATING_GAP_LABEL.overrated;
		case RATING_GAP_KIND.even:
			return "—";
		default: {
			const _never: never = kind;
			return _never;
		}
	}
}

export function formatRatingGap(value: number): string {
	if (value > 0) {
		return `+${formatRosterAverage(value)}`;
	}

	return formatRosterAverage(value);
}

export function formatRatingGapValue(value: number): string {
	return formatRosterAverage(value);
}
