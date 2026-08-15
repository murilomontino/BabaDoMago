import type { ChampionshipPlayer } from "../types/championship.ts";
import type {
	ChampionshipEvent,
	ChampionshipEventMatch,
	ChampionshipEventMatchPlayer,
	ChampionshipEventTeam,
} from "../types/championship-event.ts";
import { EVENT_TEAM_COLOR } from "./event-team-color.ts";
import {
	aggregateSynergyPairs,
	championshipSynergyRanking,
	countsForSynergy,
	formatSynergyStat,
	playerSynergyPartners,
	rankSynergyPairRows,
	SYNERGY_COLUMN,
	SYNERGY_LABEL,
	SYNERGY_MIN_MATCHES,
	SYNERGY_PARTNER_LIMIT,
	SYNERGY_RANKING_LIMIT,
	synergyMeetsMinMatches,
	synergyPairKey,
	synergyPartnersOf,
	synergyPodiumStandings,
	topSynergyRows,
} from "./player-synergy.ts";
import { PODIUM_PLACE } from "./podium.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function player(id: number, displayName: string): ChampionshipPlayer {
	return {
		id,
		championship_id: 1,
		user_id: null,
		display_name: displayName,
		nickname: null,
		avatar_url: null,
		rating: 5,
		role: "member",
		deleted_at: null,
		goals: 0,
		assists: 0,
		assisted_goals: 0,
		own_goals: 0,
		wins: 0,
		losses: 0,
		draws: 0,
		matches: 0,
		mvps: 0,
	};
}

function matchPlayer(
	overrides: Partial<ChampionshipEventMatchPlayer> &
		Pick<ChampionshipEventMatchPlayer, "player_id" | "team_id">,
): ChampionshipEventMatchPlayer {
	return {
		id: overrides.id ?? overrides.player_id,
		match_id: 1,
		event_id: 1,
		display_name: String(overrides.player_id),
		is_goalkeeper: false,
		slot: 1,
		is_substituted: false,
		include_stats: true,
		...overrides,
	};
}

function match(
	overrides: Partial<ChampionshipEventMatch> & {
		players: ChampionshipEventMatchPlayer[];
	},
): ChampionshipEventMatch {
	return {
		id: 1,
		event_id: 1,
		team_a_id: 10,
		team_b_id: 20,
		created_at: "2026-08-14T22:00:00.000Z",
		ended_at: "2026-08-14T22:10:00.000Z",
		winner_team_id: 10,
		duration_seconds: 420,
		started_at: "2026-08-14T22:00:00.000Z",
		paused_at: null,
		pause_accumulated_seconds: 0,
		goals: [],
		...overrides,
	};
}

function team(
	id: number,
	players: { player_id: number }[],
): ChampionshipEventTeam {
	return {
		id,
		event_id: 1,
		color: EVENT_TEAM_COLOR.white,
		sort_order: id,
		players: players.map((row) => ({
			id: row.player_id,
			event_id: 1,
			team_id: id,
			player_id: row.player_id,
			display_name: String(row.player_id),
			is_goalkeeper: false,
		})),
	};
}

function eventWithMatch(
	matchRow: ChampionshipEventMatch,
	teams: ChampionshipEventTeam[] = [],
	skipGuestGk = true,
): ChampionshipEvent {
	return {
		id: 1,
		championship_id: 1,
		starts_at: "2026-08-14T22:00:00.000Z",
		players_per_team: 5,
		skip_guest_goalkeeper_matches: skipGuestGk,
		ended_at: "2026-08-14T23:00:00.000Z",
		attendance: [],
		teams,
		matches: [matchRow],
	};
}

const ana = player(1, "Ana");
const bruno = player(2, "Bruno");
const caio = player(3, "Caio");
const davi = player(4, "Davi");

check(synergyPairKey(2, 1) === "1:2", "pair key ordered");
check(synergyPairKey(1, 2) === "1:2", "pair key stable");
check(SYNERGY_MIN_MATCHES === 0, "min matches off");
check(synergyMeetsMinMatches(1), "one match meets floor");
check(SYNERGY_RANKING_LIMIT === 20, "ranking limit");
check(SYNERGY_PARTNER_LIMIT === 30, "partner limit");
check(SYNERGY_LABEL.tab === "Sinergia", "tab label");
check(
	SYNERGY_LABEL.emptyPartners === "Ainda não jogou em dupla",
	"empty partners",
);
check(formatSynergyStat(SYNERGY_COLUMN.wins, 3) === "3", "format wins");
check(formatSynergyStat(SYNERGY_COLUMN.matches, 4) === "4", "format matches");
check(formatSynergyStat(SYNERGY_COLUMN.winRate, 0.5) === "50%", "format wr");

const endedWin = {
	ended_at: "2026-08-14T22:10:00.000Z",
	winner_team_id: 10,
};
const fieldPlayer = matchPlayer({ player_id: 1, team_id: 10 });
check(countsForSynergy(fieldPlayer, endedWin, 10, true), "field player counts");
check(
	!countsForSynergy(
		matchPlayer({ player_id: 1, team_id: 10, include_stats: false }),
		endedWin,
		10,
		true,
	),
	"skips include_stats false",
);
check(
	!countsForSynergy(
		fieldPlayer,
		{ ended_at: null, winner_team_id: null },
		10,
		true,
	),
	"skips open match",
);

const guestGk = matchPlayer({
	player_id: 9,
	team_id: 10,
	is_goalkeeper: true,
});
check(
	!countsForSynergy(
		guestGk,
		{ ended_at: endedWin.ended_at, winner_team_id: 20 },
		20,
		true,
	),
	"skips guest gk loss",
);
check(
	countsForSynergy(guestGk, endedWin, 20, false),
	"guest gk counts when skip off",
);
check(countsForSynergy(guestGk, endedWin, 10, true), "roster gk counts");
check(
	countsForSynergy(
		guestGk,
		{ ended_at: endedWin.ended_at, winner_team_id: 10 },
		20,
		true,
	),
	"guest gk win counts",
);

const winMatch = match({
	players: [
		matchPlayer({ player_id: 1, team_id: 10, display_name: "Ana" }),
		matchPlayer({ player_id: 2, team_id: 10, display_name: "Bruno" }),
		matchPlayer({ player_id: 3, team_id: 20, display_name: "Caio" }),
		matchPlayer({ player_id: 4, team_id: 20, display_name: "Davi" }),
	],
	winner_team_id: 10,
});
const pairs = aggregateSynergyPairs(
	[eventWithMatch(winMatch)],
	[ana, bruno, caio, davi],
);
check(pairs.length === 2, "two same-team pairs");
const anaBruno = pairs.find((row) => row.left.id === 1 && row.right.id === 2);
const caioDavi = pairs.find((row) => row.left.id === 3 && row.right.id === 4);
check(anaBruno?.matches === 1, "ana bruno played");
check(anaBruno?.wins === 1, "ana bruno won");
check(anaBruno?.winRate === 1, "ana bruno wr");
check(caioDavi?.matches === 1, "caio davi played");
check(caioDavi?.wins === 0, "caio davi lost");
check(caioDavi?.winRate === 0, "caio davi wr");

const drawMatch = match({
	players: [
		matchPlayer({ player_id: 1, team_id: 10 }),
		matchPlayer({ player_id: 2, team_id: 10 }),
	],
	winner_team_id: null,
});
const drawPairs = aggregateSynergyPairs(
	[eventWithMatch(drawMatch)],
	[ana, bruno],
);
check(drawPairs[0]?.matches === 1, "draw counts match");
check(drawPairs[0]?.wins === 0, "draw is not a win");

const openMatch = match({
	ended_at: null,
	winner_team_id: null,
	players: [
		matchPlayer({ player_id: 1, team_id: 10 }),
		matchPlayer({ player_id: 2, team_id: 10 }),
	],
});
check(
	aggregateSynergyPairs([eventWithMatch(openMatch)], [ana, bruno]).length === 0,
	"open match skipped",
);

const twoWins = aggregateSynergyPairs(
	[
		eventWithMatch(winMatch),
		{
			...eventWithMatch(
				match({
					id: 2,
					players: [
						matchPlayer({ player_id: 1, team_id: 10, display_name: "Ana" }),
						matchPlayer({ player_id: 2, team_id: 10, display_name: "Bruno" }),
					],
					winner_team_id: 10,
				}),
			),
			id: 2,
		},
	],
	[ana, bruno],
);
check(twoWins[0]?.matches === 2, "pairs accumulate matches");
check(twoWins[0]?.wins === 2, "pairs accumulate wins");

const ranked = rankSynergyPairRows([
	{
		left: ana,
		right: caio,
		matches: 20,
		wins: 15,
		winRate: 0.75,
	},
	{
		left: ana,
		right: bruno,
		matches: 1,
		wins: 1,
		winRate: 1,
	},
	{
		left: bruno,
		right: caio,
		matches: 2,
		wins: 2,
		winRate: 1,
	},
]);
check(ranked[0]?.right.id === 3, "same wr more matches first");
check(ranked[1]?.right.id === 2, "1/1 after 2/2");
check(ranked[2]?.winRate === 0.75, "lower wr last");

const many = Array.from({ length: 25 }, (_, index) => ({
	left: ana,
	right: player(index + 10, `P${index}`),
	matches: 1,
	wins: 1,
	winRate: 1,
}));
check(topSynergyRows(many, SYNERGY_RANKING_LIMIT).length === 20, "top 20");
check(
	topSynergyRows(many, SYNERGY_PARTNER_LIMIT).length === 25,
	"top 30 keeps 25",
);
check(topSynergyRows(many, 0).length === 0, "limit zero");

const partners = synergyPartnersOf(pairs, 1);
check(partners.length === 1, "ana has one partner");
check(partners[0]?.partner.id === 2, "ana partner is bruno");
check(synergyPartnersOf(pairs, 99).length === 0, "unknown player empty");

const ranking = championshipSynergyRanking(
	[eventWithMatch(winMatch)],
	[ana, bruno, caio, davi],
);
check(ranking[0]?.left.id === 1, "ranking winner pair first");
check(ranking.length === 2, "ranking has both pairs");

const anaPartners = playerSynergyPartners(
	[eventWithMatch(winMatch)],
	[ana, bruno, caio, davi],
	1,
);
check(anaPartners.length === 1, "ana partners from helper");
check(anaPartners[0]?.partner.display_name === "Bruno", "resolves roster name");

const missing = aggregateSynergyPairs(
	[
		eventWithMatch(
			match({
				players: [
					matchPlayer({ player_id: 80, team_id: 10, display_name: "Ghost" }),
					matchPlayer({ player_id: 81, team_id: 10, display_name: "Shadow" }),
				],
			}),
		),
	],
	[],
);
check(missing[0]?.left.display_name === "Ghost", "fallback left name");
check(missing[0]?.right.display_name === "Shadow", "fallback right name");

const guestEvent = eventWithMatch(
	match({
		players: [
			matchPlayer({ player_id: 1, team_id: 10, display_name: "Ana" }),
			matchPlayer({
				player_id: 9,
				team_id: 10,
				display_name: "GK",
				is_goalkeeper: true,
			}),
			matchPlayer({ player_id: 2, team_id: 10, display_name: "Bruno" }),
		],
		winner_team_id: 20,
	}),
	[
		team(10, [{ player_id: 1 }, { player_id: 2 }]),
		team(20, [{ player_id: 3 }]),
	],
	true,
);
const withoutGuest = aggregateSynergyPairs(
	[guestEvent],
	[ana, bruno, player(9, "GK")],
);
check(withoutGuest.length === 1, "guest gk pair dropped");
check(withoutGuest[0]?.left.id === 1, "remaining pair ana");
check(withoutGuest[0]?.right.id === 2, "remaining pair bruno");

const podiumPairs = synergyPodiumStandings(ranked);
check(podiumPairs[0]?.place === PODIUM_PLACE.first, "synergy first place");
check(podiumPairs[0]?.rows[0]?.right.id === 3, "synergy first is 2/2");
check(podiumPairs.length === 2, "synergy two distinct wr");

console.log("player-synergy ok");
