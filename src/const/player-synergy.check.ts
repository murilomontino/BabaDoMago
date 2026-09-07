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
	championshipSynergyWorst,
	countsForSynergy,
	formatSynergyDeltaPp,
	formatSynergyStat,
	playerIndividualWinRate,
	playerSynergy,
	playerSynergyPartners,
	rankSynergyPairRows,
	rankSynergyPairRowsWorst,
	SYNERGY_COLUMN,
	SYNERGY_DELTA_BAND,
	SYNERGY_FOCUS,
	SYNERGY_LABEL,
	SYNERGY_MIN_MATCHES,
	SYNERGY_PARTNER_LIMIT,
	SYNERGY_RANKING_LIMIT,
	SYNERGY_VOLUME,
	SYNERGY_WINDOW,
	SYNERGY_WR_BAND,
	synergyDeltaBand,
	synergyEmptyMessage,
	synergyMeetsMinMatches,
	synergyPairKey,
	synergyPartnerColumnAbbr,
	synergyPartnersForFocus,
	synergyPartnersOf,
	synergyPodiumStandings,
	synergyVolumeLevel,
	synergyWindowEvents,
	synergyWrBand,
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
		nickname_tags: [],
		avatar_url: null,
		rating: 5,
		goalkeeper_rating: 0,
		role: "member",
		is_goalkeeper: false,
		is_monthly: false,
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
		is_active: true,
		template_player_ids: [],
		template_goalkeeper_id: 0,
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
		rsvps: [],
		teams,
		matches: [matchRow],
	};
}

function repeatEvent(
	event: ChampionshipEvent,
	times = SYNERGY_MIN_MATCHES,
): ChampionshipEvent[] {
	return Array.from({ length: times }, (_, index) => ({
		...event,
		id: index + 1,
		matches: event.matches.map((item, matchIndex) => ({
			...item,
			id: index * 10 + matchIndex + 1,
			event_id: index + 1,
		})),
	}));
}

const ana = player(1, "Ana");
const bruno = player(2, "Bruno");
const caio = player(3, "Caio");
const davi = player(4, "Davi");

check(synergyPairKey(2, 1) === "1:2", "pair key ordered");
check(synergyPairKey(1, 2) === "1:2", "pair key stable");
check(SYNERGY_MIN_MATCHES === 3, "min matches");
check(!synergyMeetsMinMatches(1), "one match below floor");
check(synergyMeetsMinMatches(3), "three matches meet floor");
check(SYNERGY_RANKING_LIMIT === 20, "ranking limit");
check(SYNERGY_PARTNER_LIMIT === 30, "partner limit");
check(SYNERGY_LABEL.tab === "Sinergia", "tab label");
check(
	synergyPartnerColumnAbbr(SYNERGY_COLUMN.player) === "Parc",
	"partner abbr",
);
check(
	synergyPartnerColumnAbbr(SYNERGY_COLUMN.wins) === "V",
	"partner wins abbr",
);
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
const pairs = aggregateSynergyPairs(repeatEvent(eventWithMatch(winMatch)), [
	ana,
	bruno,
	caio,
	davi,
]);
check(pairs.length === 2, "two same-team pairs");
const anaBruno = pairs.find((row) => row.left.id === 1 && row.right.id === 2);
const caioDavi = pairs.find((row) => row.left.id === 3 && row.right.id === 4);
check(anaBruno?.matches === 3, "ana bruno played");
check(anaBruno?.wins === 3, "ana bruno won");
check(anaBruno?.winRate === 1, "ana bruno wr");
check(caioDavi?.matches === 3, "caio davi played");
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
	repeatEvent(eventWithMatch(drawMatch)),
	[ana, bruno],
);
check(drawPairs[0]?.matches === 3, "draw counts match");
check(drawPairs[0]?.wins === 0, "draw is not a win");
check(drawPairs[0]?.draws === 3, "draw counts draws");
check(drawPairs[0]?.losses === 0, "draw not loss");

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
	repeatEvent(
		eventWithMatch(
			match({
				players: [
					matchPlayer({ player_id: 1, team_id: 10, display_name: "Ana" }),
					matchPlayer({ player_id: 2, team_id: 10, display_name: "Bruno" }),
				],
				winner_team_id: 10,
			}),
		),
	),
	[ana, bruno],
);
check(twoWins[0]?.matches === 3, "pairs accumulate matches");
check(twoWins[0]?.wins === 3, "pairs accumulate wins");
check(anaBruno?.draws === 0, "ana bruno draws");
check(anaBruno?.losses === 0, "ana bruno losses");
check(caioDavi?.draws === 0, "caio davi draws");
check(caioDavi?.losses === 3, "caio davi losses");

const ranked = rankSynergyPairRows([
	{
		left: ana,
		right: caio,
		matches: 20,
		wins: 15,
		draws: 0,
		losses: 5,
		winRate: 0.75,
	},
	{
		left: ana,
		right: bruno,
		matches: 1,
		wins: 1,
		draws: 0,
		losses: 0,
		winRate: 1,
	},
	{
		left: bruno,
		right: caio,
		matches: 2,
		wins: 2,
		draws: 0,
		losses: 0,
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
	draws: 0,
	losses: 0,
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
check(ranking.length === 0, "ranking skips below floor");

const threeWins = championshipSynergyRanking(
	[
		eventWithMatch(winMatch),
		{
			...eventWithMatch(match({ id: 2, players: winMatch.players })),
			id: 2,
		},
		{
			...eventWithMatch(match({ id: 3, players: winMatch.players })),
			id: 3,
		},
	],
	[ana, bruno, caio, davi],
);
check(threeWins.length === 2, "ranking has both pairs after floor");
check(threeWins[0]?.left.id === 1, "ranking winner pair first");

const worst = championshipSynergyWorst(
	[
		eventWithMatch(winMatch),
		{
			...eventWithMatch(match({ id: 2, players: winMatch.players })),
			id: 2,
		},
		{
			...eventWithMatch(match({ id: 3, players: winMatch.players })),
			id: 3,
		},
	],
	[ana, bruno, caio, davi],
);
check(worst[0]?.left.id === 3, "worst starts with losing pair");
check(
	rankSynergyPairRowsWorst(ranked)[0]?.winRate === 0.75,
	"worst ranks lowest wr first",
);

const anaPartners = playerSynergyPartners(
	[
		eventWithMatch(winMatch),
		{
			...eventWithMatch(match({ id: 2, players: winMatch.players })),
			id: 2,
		},
		{
			...eventWithMatch(match({ id: 3, players: winMatch.players })),
			id: 3,
		},
	],
	[ana, bruno, caio, davi],
	1,
);
check(anaPartners.length === 1, "ana partners from helper");
check(anaPartners[0]?.partner.display_name === "Bruno", "resolves roster name");
check(anaPartners[0]?.volumeLevel === SYNERGY_VOLUME.small, "ana volume small");
check(anaPartners[0]?.synergyDelta === 0, "ana delta vs self wr 100%");

const missing = aggregateSynergyPairs(
	repeatEvent(
		eventWithMatch(
			match({
				players: [
					matchPlayer({ player_id: 80, team_id: 10, display_name: "Ghost" }),
					matchPlayer({ player_id: 81, team_id: 10, display_name: "Shadow" }),
				],
			}),
		),
	),
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
const withoutGuest = aggregateSynergyPairs(repeatEvent(guestEvent), [
	ana,
	bruno,
	player(9, "GK"),
]);
check(withoutGuest.length === 1, "guest gk pair dropped");
check(withoutGuest[0]?.left.id === 1, "remaining pair ana");
check(withoutGuest[0]?.right.id === 2, "remaining pair bruno");

const podiumPairs = synergyPodiumStandings(ranked);
check(podiumPairs[0]?.place === PODIUM_PLACE.first, "synergy first place");
check(podiumPairs[0]?.rows[0]?.right.id === 3, "synergy first is 2/2");
check(podiumPairs.length === 2, "synergy two distinct wr");

check(synergyVolumeLevel(3) === SYNERGY_VOLUME.small, "volume 3 small");
check(synergyVolumeLevel(4) === SYNERGY_VOLUME.small, "volume 4 small");
check(synergyVolumeLevel(5) === SYNERGY_VOLUME.medium, "volume 5 medium");
check(synergyVolumeLevel(9) === SYNERGY_VOLUME.medium, "volume 9 medium");
check(synergyVolumeLevel(10) === SYNERGY_VOLUME.large, "volume 10 large");
check(synergyWrBand(0.4) === SYNERGY_WR_BAND.low, "wr low");
check(synergyWrBand(0.5) === SYNERGY_WR_BAND.neutral, "wr neutral");
check(synergyWrBand(0.6) === SYNERGY_WR_BAND.high, "wr high");
check(synergyDeltaBand(0.12) === SYNERGY_DELTA_BAND.veryPositive, "delta ++");
check(synergyDeltaBand(0.07) === SYNERGY_DELTA_BAND.positive, "delta +");
check(synergyDeltaBand(0) === SYNERGY_DELTA_BAND.neutral, "delta 0");
check(synergyDeltaBand(-0.07) === SYNERGY_DELTA_BAND.negative, "delta -");
check(synergyDeltaBand(-0.12) === SYNERGY_DELTA_BAND.veryNegative, "delta --");
check(formatSynergyDeltaPp(0.18) === "+18 pp", "format +delta");
check(formatSynergyDeltaPp(-0.043) === "-4.3 pp", "format -delta");

const mixedEvents = [
	{
		...eventWithMatch(winMatch),
		id: 1,
		starts_at: "2026-01-01T22:00:00.000Z",
		ended_at: "2026-01-01T23:00:00.000Z",
	},
	{
		...eventWithMatch(match({ id: 2, players: winMatch.players })),
		id: 2,
		starts_at: "2026-02-01T22:00:00.000Z",
		ended_at: "2026-02-01T23:00:00.000Z",
	},
	{
		...eventWithMatch(match({ id: 3, players: winMatch.players })),
		id: 3,
		starts_at: "2026-03-01T22:00:00.000Z",
		ended_at: "2026-03-01T23:00:00.000Z",
	},
	{
		...eventWithMatch(match({ id: 4, players: winMatch.players })),
		id: 4,
		starts_at: "2026-04-01T22:00:00.000Z",
		ended_at: "2026-04-01T23:00:00.000Z",
	},
	{
		...eventWithMatch(match({ id: 5, players: winMatch.players })),
		id: 5,
		starts_at: "2026-05-01T22:00:00.000Z",
		ended_at: "2026-05-01T23:00:00.000Z",
	},
];
check(
	synergyWindowEvents(mixedEvents, SYNERGY_WINDOW.last3).length === 3,
	"window last3",
);
check(
	synergyWindowEvents(mixedEvents, SYNERGY_WINDOW.all).length === 5,
	"window all",
);

const network = playerSynergy(mixedEvents, [ana, bruno, caio, davi], 1, {
	window: SYNERGY_WINDOW.all,
});
check(network.partners.length === 1, "playerSynergy partners");
check(network.bestPartners[0]?.partner.id === 2, "best partner bruno");
check(network.worstPartners[0]?.partner.id === 2, "worst same when one");
check(network.playerWinRate === 1, "player wr");
check(network.playerMatches === 5, "player matches");

const individual = playerIndividualWinRate(mixedEvents, 1);
check(individual.wins === 5, "individual wins");
check(individual.matches === 5, "individual matches");

const last3Network = playerSynergy(mixedEvents, [ana, bruno, caio, davi], 1, {
	window: SYNERGY_WINDOW.last3,
});
check(last3Network.partners.length === 1, "last3 still qualifies");

const shortWindow = playerSynergy(
	mixedEvents.slice(0, 2),
	[ana, bruno, caio, davi],
	1,
	{ window: SYNERGY_WINDOW.last3 },
);
check(shortWindow.partners.length === 0, "below floor in short window");
check(
	synergyEmptyMessage([], SYNERGY_WINDOW.last3) === SYNERGY_LABEL.emptyWindow,
	"empty window message",
);
check(
	synergyEmptyMessage([], SYNERGY_WINDOW.all) ===
		SYNERGY_LABEL.emptyInsufficient,
	"empty all message",
);

const focusBest = synergyPartnersForFocus(
	network.partners,
	SYNERGY_FOCUS.best,
	10,
);
check(focusBest[0]?.partner.id === 2, "focus best");
const focusWorst = synergyPartnersForFocus(
	network.partners,
	SYNERGY_FOCUS.worst,
	10,
);
check(focusWorst[0]?.partner.id === 2, "focus worst");

console.log("player-synergy ok");
