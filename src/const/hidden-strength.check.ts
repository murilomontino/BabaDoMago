import type { ChampionshipEvent } from "../types/championship-event.ts";
import { EVENT_TEAM_COLOR } from "./event-team-color.ts";
import {
	championshipTeamHiddenBalance,
	eventTeamHiddenBalance,
	formatHiddenStrength,
	HIDDEN_STRENGTH,
	HIDDEN_STRENGTH_TRACK,
	hiddenStrengthApply,
	hiddenStrengthCeiling,
	hiddenStrengthChampionshipCeiling,
	hiddenStrengthCurrent,
	hiddenStrengthDelta,
	hiddenStrengthDeltaFromRate,
	hiddenStrengthDisplayed,
	hiddenStrengthForPlayer,
	hiddenStrengthRateInDeadZone,
	hiddenStrengthSeed,
	hiddenStrengthWalk,
} from "./hidden-strength.ts";
import { PLAYER_RATING } from "./player-rating.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(HIDDEN_STRENGTH.min === 1, "min 1");
check(HIDDEN_STRENGTH.max === 100, "max 100");
check(HIDDEN_STRENGTH.downThreshold === 0.495, "down 0.495");
check(HIDDEN_STRENGTH.upThreshold === 0.505, "up 0.505");

check(hiddenStrengthCeiling([8.1, 7.3, 3, 0]) === 8.1, "teto = maior do campeonato");
check(hiddenStrengthCeiling([0, 0]) === 0, "sem nota teto 0");
check(
	hiddenStrengthChampionshipCeiling([
		{ rating: 7.3, goalkeeper_rating: 4, deleted_at: null },
		{ rating: 3, goalkeeper_rating: 8.1, deleted_at: null },
	]) === 8.1,
	"teto unico linha ou goleiro",
);
check(hiddenStrengthSeed(0, 5) === 0, "sentinel seed");
check(hiddenStrengthSeed(5, 5) === 100, "ceiling maps to 100");
check(hiddenStrengthSeed(7.3, 7.3) === 100, "maior nota = 100");
check(hiddenStrengthSeed(7.3, 8.1) !== 100, "7.3 so e 100 se for o teto");
check(hiddenStrengthSeed(8.1, 8.1) === 100, "8.1 e teto = 100");
check(hiddenStrengthSeed(3, 7.3) === 41.1, "3 / teto * 100");
check(hiddenStrengthSeed(3.65, 7.3) === 50, "metade do teto = 50");
check(hiddenStrengthSeed(3, 5) === 60, "3 of 5 rescales to 60 not 1");
check(hiddenStrengthSeed(4, 5) === 80, "4 of 5 rescales to 80");
check(hiddenStrengthSeed(2.7, 5) === 54, "semente baixa nao vira 1");
check(hiddenStrengthSeed(6, 5) === 100, "above ceiling clamps");
check(hiddenStrengthSeed(3, 0) === 0, "sem teto fica sentinela");
check(hiddenStrengthApply(100, 8.3) === 100, "teto 100");
check(hiddenStrengthApply(99.5, 8.3) === 100, "sobe ate 100");
check(hiddenStrengthApply(1, -8.3) === 1, "piso 1");

check(hiddenStrengthRateInDeadZone(0.5), "50% dead");
check(hiddenStrengthRateInDeadZone(0.495), "49.5% dead");
check(hiddenStrengthRateInDeadZone(0.505), "50.5% dead");
check(!hiddenStrengthRateInDeadZone(0.494), "49.4% live");
check(!hiddenStrengthRateInDeadZone(0.506), "50.6% live");
check(!hiddenStrengthRateInDeadZone(0.45), "45% live for hidden");
check(!hiddenStrengthRateInDeadZone(0.55), "55% live for hidden");

check(hiddenStrengthDeltaFromRate(0.5, 3) === 0, "delta 50%");
check(hiddenStrengthDeltaFromRate(0.495, 6) === 0, "delta 49.5%");
check(hiddenStrengthDeltaFromRate(0.505, 6) === 0, "delta 50.5%");
check(hiddenStrengthDeltaFromRate(0.54, 6) === 2, "delta 54% = +2");
check(hiddenStrengthDeltaFromRate(0.46, 6) === -2, "delta 46% = -2");
check(hiddenStrengthDeltaFromRate(0.54, 2) === 0, "few matches");
check(hiddenStrengthDelta(3, 0, 3, 6) === 0, "3W3L = 50%");
check(hiddenStrengthDelta(4, 0, 2, 6) === 8.3, "4W2L delta");
check(hiddenStrengthDelta(2, 0, 4, 6) === -8.3, "2W4L delta");

check(formatHiddenStrength(0) === "—", "format sentinel");
check(formatHiddenStrength(42.5) === "42.5", "format value");

function attendance(
	partial: Partial<ChampionshipEvent["attendance"][number]> & {
		id: number;
		player_id: number;
		display_name: string;
	},
): ChampionshipEvent["attendance"][number] {
	return {
		event_id: 1,
		is_goalkeeper: false,
		event_date: "2026-08-01",
		goals: 0,
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: 0,
		losses: 0,
		draws: 0,
		matches: 0,
		rating: 0,
		rating_delta: 0,
		goalkeeper_rating: 0,
		goalkeeper_rating_delta: 0,
		vote_rating_delta: 0,
		goalkeeper_vote_rating_delta: 0,
		is_mvp: false,
		mvp_overridden: false,
		...partial,
	};
}

function eventRow(overrides: {
	id: number;
	starts_at: string;
	ended_at: string | null;
	attendance: ChampionshipEvent["attendance"];
	teams?: ChampionshipEvent["teams"];
	matches?: ChampionshipEvent["matches"];
}): ChampionshipEvent {
	return {
		id: overrides.id,
		championship_id: 1,
		starts_at: overrides.starts_at,
		players_per_team: 5,
		skip_guest_goalkeeper_matches: true,
		ended_at: overrides.ended_at,
		attendance: overrides.attendance,
		rsvps: [],
		teams: overrides.teams ?? [],
		matches: overrides.matches ?? [],
	};
}

const roundZero = eventRow({
	id: 1,
	starts_at: "2026-08-01T22:00:00.000Z",
	ended_at: "2026-08-01T23:00:00.000Z",
	attendance: [
		attendance({
			id: 1,
			player_id: 1,
			display_name: "Ana",
			rating: 5,
			wins: 3,
			losses: 3,
			matches: 6,
		}),
		attendance({
			id: 2,
			player_id: 2,
			display_name: "Bruno",
			rating: 3,
			wins: 3,
			losses: 3,
			matches: 6,
		}),
		attendance({
			id: 3,
			player_id: 3,
			display_name: "Caio",
			rating: 0,
			wins: 3,
			losses: 3,
			matches: 6,
		}),
	],
	teams: [
		{
			id: 10,
			event_id: 1,
			color: EVENT_TEAM_COLOR.white,
			sort_order: 0,
			is_active: true,
			template_player_ids: [],
			template_goalkeeper_id: 0,
			players: [
				{
					id: 1,
					event_id: 1,
					team_id: 10,
					player_id: 1,
					display_name: "Ana",
					is_goalkeeper: false,
				},
			],
		},
		{
			id: 20,
			event_id: 1,
			color: EVENT_TEAM_COLOR.black,
			sort_order: 1,
			is_active: true,
			template_player_ids: [],
			template_goalkeeper_id: 0,
			players: [
				{
					id: 2,
					event_id: 1,
					team_id: 20,
					player_id: 2,
					display_name: "Bruno",
					is_goalkeeper: false,
				},
			],
		},
	],
	matches: [
		{
			id: 1,
			event_id: 1,
			team_a_id: 10,
			team_b_id: 20,
			created_at: "2026-08-01T22:00:00.000Z",
			ended_at: "2026-08-01T22:10:00.000Z",
			winner_team_id: 10,
			duration_seconds: 420,
			started_at: "2026-08-01T22:00:00.000Z",
			paused_at: null,
			pause_accumulated_seconds: 0,
			players: [],
			goals: [],
		},
	],
});

const walkZero = hiddenStrengthWalk([roundZero]);
check(walkZero.hiddenBeforeEvent.get(1)?.get(1) === 100, "ana seed 5/5 = 100");
check(walkZero.hiddenBeforeEvent.get(1)?.get(2) === 60, "bruno seed 3/5 = 60");
check(walkZero.hiddenBeforeEvent.get(1)?.get(3) === 0, "caio sentinel before");
check(hiddenStrengthForPlayer(walkZero, 1) === 100, "ana after 50% stays");
check(hiddenStrengthForPlayer(walkZero, 2) === 60, "bruno after 50% stays");
check(hiddenStrengthForPlayer(walkZero, 3) === 0, "caio still sentinel");
check(
	hiddenStrengthDisplayed(0, 3, 7.3) === 41.1,
	"fallback usa nota atual / teto",
);
check(hiddenStrengthDisplayed(80, 3, 7.3) === 80, "stored vence fallback");

const balanceZero = eventTeamHiddenBalance(
	roundZero,
	walkZero.hiddenBeforeEvent.get(1),
);
check(balanceZero !== null, "hidden balance exists");
check(balanceZero?.favoriteTeamId === 10, "favorite follows seed order");
check(balanceZero?.favoriteWon === true, "favorite won round 0");

const roundTwo = eventRow({
	id: 2,
	starts_at: "2026-08-08T22:00:00.000Z",
	ended_at: "2026-08-08T23:00:00.000Z",
	attendance: [
		attendance({
			id: 4,
			event_id: 2,
			player_id: 1,
			display_name: "Ana",
			rating: 5,
			wins: 4,
			losses: 2,
			matches: 6,
		}),
		attendance({
			id: 5,
			event_id: 2,
			player_id: 2,
			display_name: "Bruno",
			rating: 3,
			wins: 2,
			losses: 4,
			matches: 6,
		}),
		attendance({
			id: 6,
			event_id: 2,
			player_id: 3,
			display_name: "Caio",
			rating: 4,
			wins: 3,
			losses: 3,
			matches: 6,
		}),
		attendance({
			id: 7,
			event_id: 2,
			player_id: 4,
			display_name: "Duda",
			rating: 9,
			wins: 3,
			losses: 3,
			matches: 6,
		}),
	],
});

const walk = hiddenStrengthWalk([roundZero, roundTwo]);
check(
	walk.hiddenBeforeEvent.get(2)?.get(1) === 100,
	"ana before round 2 = prior hidden",
);
check(hiddenStrengthForPlayer(walk, 1) === 100, "ana +8.3 clamped at 100");
check(
	Math.abs(hiddenStrengthForPlayer(walk, 2) - 51.7) < 0.001,
	"bruno 60 - 8.3",
);
check(
	walk.hiddenBeforeEvent.get(2)?.get(3) === hiddenStrengthSeed(4, 9),
	"caio seeds on first official with that event ceiling",
);
check(walk.hiddenBeforeEvent.get(2)?.get(4) === 100, "duda 9/9 = 100");
check(
	hiddenStrengthCurrent(walk).get(3)?.line !== PLAYER_RATING.default,
	"caio current seeded",
);

check(hiddenStrengthSeed(5, 5) === 100, "seed from attendance snapshot");

const open = { ...roundZero, ended_at: null };
check(hiddenStrengthWalk([open]).current.size === 0, "skips open event");

const summary = championshipTeamHiddenBalance([roundZero], walkZero);
check(summary.events === 1, "one ended balance");
check(summary.favoriteWon === 1, "favorite win count");
check(HIDDEN_STRENGTH_TRACK.line === "line", "line track id");

console.log("hidden-strength ok");
