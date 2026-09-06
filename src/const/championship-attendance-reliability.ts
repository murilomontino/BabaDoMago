import type { ChampionshipPlayer } from "../types/championship.ts";
import type { ChampionshipEvent } from "../types/championship-event.ts";
import { compareStartsAtNewestFirst } from "./championship-event.ts";
import { playerVisibleName } from "./player-name.ts";
import {
	formatRosterCount,
	formatRosterWinRate,
	rosterWinRate,
} from "./roster-stats.ts";

export const ATTENDANCE_RELIABILITY_LABEL = {
	title: "Confiabilidade de presença",
	empty: "Nenhum RSVP going nas rodadas",
	hint: "Confirmar e não ir conta como furo. Sem RSVP não entra.",
	confirmed: "Confirmou",
	attended: "Compareceu",
	noShows: "Furou",
	rate: "Comparecimento",
	streak: "Furos seguidos",
} as const;

export const ATTENDANCE_RELIABILITY_COLUMN = {
	player: "player",
	confirmed: "confirmed",
	attended: "attended",
	noShows: "noShows",
	rate: "rate",
	streak: "streak",
} as const;

export type AttendanceReliabilityColumnId =
	(typeof ATTENDANCE_RELIABILITY_COLUMN)[keyof typeof ATTENDANCE_RELIABILITY_COLUMN];

export const ATTENDANCE_RELIABILITY_COLUMN_ABBR = {
	[ATTENDANCE_RELIABILITY_COLUMN.player]: "Jog",
	[ATTENDANCE_RELIABILITY_COLUMN.confirmed]: "Conf",
	[ATTENDANCE_RELIABILITY_COLUMN.attended]: "Pres",
	[ATTENDANCE_RELIABILITY_COLUMN.noShows]: "Furo",
	[ATTENDANCE_RELIABILITY_COLUMN.rate]: "Cmp",
	[ATTENDANCE_RELIABILITY_COLUMN.streak]: "Seq",
} as const;

export const ATTENDANCE_RELIABILITY_COLUMN_LABEL = {
	[ATTENDANCE_RELIABILITY_COLUMN.player]: "Jogador",
	[ATTENDANCE_RELIABILITY_COLUMN.confirmed]:
		ATTENDANCE_RELIABILITY_LABEL.confirmed,
	[ATTENDANCE_RELIABILITY_COLUMN.attended]:
		ATTENDANCE_RELIABILITY_LABEL.attended,
	[ATTENDANCE_RELIABILITY_COLUMN.noShows]: ATTENDANCE_RELIABILITY_LABEL.noShows,
	[ATTENDANCE_RELIABILITY_COLUMN.rate]: ATTENDANCE_RELIABILITY_LABEL.rate,
	[ATTENDANCE_RELIABILITY_COLUMN.streak]: ATTENDANCE_RELIABILITY_LABEL.streak,
} as const;

export type AttendanceReliabilityRow = {
	player: ChampionshipPlayer;
	confirmed: number;
	attended: number;
	noShows: number;
	rate: number;
	noShowStreak: number;
};

const RSVP_GOING = "going" as const;

function isGoingRsvp(status: string): boolean {
	return status === RSVP_GOING;
}

function noShowStreakFromNewest(
	eventsNewestFirst: readonly ChampionshipEvent[],
	playerId: number,
): number {
	let streak = 0;

	for (const event of eventsNewestFirst) {
		const going = event.rsvps.some(
			(rsvp) => rsvp.player_id === playerId && isGoingRsvp(rsvp.status),
		);
		if (!going) {
			continue;
		}

		const present = event.attendance.some((row) => row.player_id === playerId);
		if (present) {
			return streak;
		}

		streak += 1;
	}

	return streak;
}

export function championshipAttendanceReliability(
	players: readonly ChampionshipPlayer[],
	events: readonly ChampionshipEvent[],
): AttendanceReliabilityRow[] {
	const ended = events
		.filter((event) => event.ended_at !== null)
		.slice()
		.sort(compareStartsAtNewestFirst);

	const rows = players.flatMap((player) => {
		if (player.deleted_at !== null) {
			return [];
		}

		let confirmed = 0;
		let attended = 0;

		for (const event of ended) {
			const going = event.rsvps.some(
				(rsvp) => rsvp.player_id === player.id && isGoingRsvp(rsvp.status),
			);
			if (!going) {
				continue;
			}

			confirmed += 1;
			const present = event.attendance.some(
				(row) => row.player_id === player.id,
			);
			if (present) {
				attended += 1;
			}
		}

		if (confirmed === 0) {
			return [];
		}

		const noShows = confirmed - attended;
		return [
			{
				player,
				confirmed,
				attended,
				noShows,
				rate: rosterWinRate(attended, confirmed),
				noShowStreak: noShowStreakFromNewest(ended, player.id),
			},
		];
	});

	return rows.sort((left, right) => {
		if (right.noShows !== left.noShows) {
			return right.noShows - left.noShows;
		}

		if (left.rate !== right.rate) {
			return left.rate - right.rate;
		}

		return playerVisibleName(left.player).localeCompare(
			playerVisibleName(right.player),
			"pt",
		);
	});
}

export function formatAttendanceReliabilityCount(value: number): string {
	return formatRosterCount(value);
}

export function formatAttendanceReliabilityRate(value: number): string {
	return formatRosterWinRate(value);
}
