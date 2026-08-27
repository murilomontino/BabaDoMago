import type {
	ChampionshipEvent,
	ChampionshipEventGoal,
	ChampionshipEventMatchPlayer,
	ChampionshipEventTeam,
	ChampionshipEventTeamPlayer,
} from "../types/championship-event.ts";
import { EVENT_ERROR_MESSAGE } from "./championship-event.ts";
import {
	applyMatchOp,
	applyMatchOps,
	applyPlayOps,
	buildMatchOp,
	isFatalMatchOpMessage,
	MATCH_OP,
	type MatchOp,
	pendingLocalGoalOpId,
} from "./championship-event-match-ops.ts";
import { EVENT_TEAM_COLOR } from "./event-team-color.ts";

function check(actual: unknown, expected: unknown, message: string): void {
	if (actual !== expected) {
		throw new Error(`${message}: ${String(actual)} !== ${String(expected)}`);
	}
}

const nowMs = Date.parse("2026-08-20T12:00:00.000Z");

function matchPlayer(
	partial: Partial<ChampionshipEventMatchPlayer> &
		Pick<ChampionshipEventMatchPlayer, "id" | "player_id" | "display_name">,
): ChampionshipEventMatchPlayer {
	return {
		match_id: 7,
		event_id: 1,
		team_id: 10,
		is_goalkeeper: false,
		slot: 1,
		is_substituted: false,
		include_stats: true,
		...partial,
	};
}

const ana = matchPlayer({
	id: 1,
	player_id: 100,
	display_name: "Ana",
	is_goalkeeper: true,
	slot: 0,
});
const beto = matchPlayer({
	id: 2,
	player_id: 101,
	display_name: "Beto",
	slot: 1,
});
const caio = matchPlayer({
	id: 3,
	player_id: 200,
	display_name: "Caio",
	team_id: 20,
	is_goalkeeper: true,
	slot: 0,
});

const baseMatch = {
	id: 7,
	event_id: 1,
	players: [ana, beto, caio],
	goals: [] as ChampionshipEventGoal[],
};

const setPlayerOp = buildMatchOp(
	{
		kind: MATCH_OP.setPlayer,
		matchId: 7,
		teamId: 10,
		slot: 1,
		playerId: 102,
		displayName: "Duda",
		includeStats: true,
	},
	1,
	nowMs,
);

const substituted = applyMatchOp(baseMatch, setPlayerOp);
const outgoing = substituted.players.find((player) => player.id === beto.id);
const incoming = substituted.players.find((player) => player.player_id === 102);
check(outgoing?.is_substituted, true, "marks outgoing substituted");
check(outgoing?.slot, null, "clears outgoing slot");
check(outgoing?.is_goalkeeper, false, "outgoing loses gloves");
check(outgoing?.include_stats, true, "keeps include stats");
check(incoming?.slot, 1, "incoming occupies slot");
check(incoming?.is_goalkeeper, false, "line player is not keeper");
check(incoming?.id, -1, "incoming uses localId");
check(incoming?.display_name, "Duda", "incoming keeps display name");

const keeperSwapIn = buildMatchOp(
	{
		kind: MATCH_OP.setPlayer,
		matchId: 7,
		teamId: 10,
		slot: 0,
		playerId: 103,
		displayName: "Eli",
		includeStats: false,
	},
	2,
	nowMs,
);
const keeperSub = applyMatchOp(baseMatch, keeperSwapIn);
const oldKeeper = keeperSub.players.find((player) => player.id === ana.id);
const newKeeper = keeperSub.players.find((player) => player.player_id === 103);
check(oldKeeper?.is_substituted, true, "outgoing keeper substituted");
check(oldKeeper?.include_stats, false, "outgoing keeper skips stats");
check(newKeeper?.is_goalkeeper, true, "slot 0 is keeper");
check(newKeeper?.slot, 0, "new keeper occupies slot 0");

const duplicate = applyMatchOp(
	baseMatch,
	buildMatchOp(
		{
			kind: MATCH_OP.setPlayer,
			matchId: 7,
			teamId: 10,
			slot: 1,
			playerId: 100,
			displayName: "Ana",
			includeStats: false,
		},
		3,
		nowMs,
	),
);
check(duplicate, baseMatch, "duplicate player is noop");

const scoredMatch = {
	...baseMatch,
	goals: [
		{
			id: 9,
			match_id: 7,
			event_id: 1,
			scorer_player_id: 101,
			assist_player_id: null,
			is_own_goal: false,
			elapsed_seconds: 12,
			created_at: "2026-08-20T12:00:00.000Z",
		},
	],
};
const blockedRemove = applyMatchOp(
	scoredMatch,
	buildMatchOp(
		{
			kind: MATCH_OP.setPlayer,
			matchId: 7,
			teamId: 10,
			slot: 1,
			playerId: null,
			displayName: "",
			includeStats: false,
		},
		4,
		nowMs,
	),
);
check(blockedRemove, scoredMatch, "remove with goals is noop");

const removed = applyMatchOp(
	baseMatch,
	buildMatchOp(
		{
			kind: MATCH_OP.setPlayer,
			matchId: 7,
			teamId: 10,
			slot: 1,
			playerId: null,
			displayName: "",
			includeStats: false,
		},
		11,
		nowMs,
	),
);
check(
	removed.players.find((player) => player.player_id === 101),
	undefined,
	"remove without goals",
);

const readded = applyMatchOp(
	removed,
	buildMatchOp(
		{
			kind: MATCH_OP.setPlayer,
			matchId: 7,
			teamId: 10,
			slot: 1,
			playerId: 101,
			displayName: "Beto",
			includeStats: false,
		},
		12,
		nowMs,
	),
);
check(
	readded.players.find((player) => player.player_id === 101)?.slot,
	1,
	"re-add after remove",
);

const clearedIncoming = applyMatchOp(
	substituted,
	buildMatchOp(
		{
			kind: MATCH_OP.setPlayer,
			matchId: 7,
			teamId: 10,
			slot: 1,
			playerId: null,
			displayName: "",
			includeStats: false,
		},
		13,
		nowMs,
	),
);
const reactivated = applyMatchOp(
	clearedIncoming,
	buildMatchOp(
		{
			kind: MATCH_OP.setPlayer,
			matchId: 7,
			teamId: 10,
			slot: 1,
			playerId: 101,
			displayName: "Beto",
			includeStats: false,
		},
		14,
		nowMs,
	),
);
const back = reactivated.players.find((player) => player.player_id === 101);
check(back?.is_substituted, false, "reactivates substituted");
check(back?.slot, 1, "reactivated slot");
check(back?.id, beto.id, "reactivated keeps row");

const swappedBack = applyMatchOp(
	substituted,
	buildMatchOp(
		{
			kind: MATCH_OP.setPlayer,
			matchId: 7,
			teamId: 10,
			slot: 1,
			playerId: 101,
			displayName: "Beto",
			includeStats: false,
		},
		15,
		nowMs,
	),
);
const restored = swappedBack.players.find((player) => player.player_id === 101);
const benched = swappedBack.players.find((player) => player.player_id === 102);
check(restored?.is_substituted, false, "swap back reactivates");
check(restored?.slot, 1, "swap back slot");
check(benched?.is_substituted, true, "outgoing becomes substituted");

const swapped = applyMatchOp(
	baseMatch,
	buildMatchOp(
		{
			kind: MATCH_OP.setGoalkeeper,
			matchId: 7,
			teamId: 10,
			playerId: 101,
		},
		5,
		nowMs,
	),
);
const promoted = swapped.players.find((player) => player.player_id === 101);
const demoted = swapped.players.find((player) => player.player_id === 100);
check(promoted?.slot, 0, "promoted keeper takes slot 0");
check(promoted?.is_goalkeeper, true, "promoted is keeper");
check(demoted?.slot, 1, "old keeper takes promoted slot");
check(demoted?.is_goalkeeper, false, "old keeper loses gloves");

const noKeeperMatch = {
	...baseMatch,
	players: [beto, caio],
};
const filledKeeper = applyMatchOp(
	noKeeperMatch,
	buildMatchOp(
		{
			kind: MATCH_OP.setGoalkeeper,
			matchId: 7,
			teamId: 10,
			playerId: 101,
		},
		6,
		nowMs,
	),
);
const onlyKeeper = filledKeeper.players.find(
	(player) => player.player_id === 101,
);
check(onlyKeeper?.slot, 0, "empty slot 0 receives keeper");
check(onlyKeeper?.is_goalkeeper, true, "empty slot 0 is keeper");

const ownGoal = applyMatchOp(
	baseMatch,
	buildMatchOp(
		{
			kind: MATCH_OP.addGoal,
			matchId: 7,
			scorerPlayerId: 101,
			assistPlayerId: 100,
			isOwnGoal: true,
			elapsedSeconds: 30,
		},
		7,
		nowMs,
	),
);
check(ownGoal.goals[0]?.assist_player_id, null, "own goal clears assist");
check(ownGoal.goals[0]?.is_own_goal, true, "own goal flag");
check(ownGoal.goals[0]?.id, -7, "local goal id");

const scored = applyMatchOp(
	baseMatch,
	buildMatchOp(
		{
			kind: MATCH_OP.addGoal,
			matchId: 7,
			scorerPlayerId: 101,
			assistPlayerId: 100,
			isOwnGoal: false,
			elapsedSeconds: 8,
		},
		8,
		nowMs,
	),
);
const undone = applyMatchOp(
	scored,
	buildMatchOp(
		{
			kind: MATCH_OP.undoGoal,
			matchId: 7,
			goalId: -8,
		},
		9,
		nowMs,
	),
);
check(undone.goals.length, 0, "undo removes local goal");

const emptyOps = applyMatchOps(baseMatch, []);
check(emptyOps, baseMatch, "empty ops returns same match");
check(applyMatchOps(null, [setPlayerOp]), null, "null match stays null");

const queued: MatchOp[] = [
	setPlayerOp,
	buildMatchOp(
		{
			kind: MATCH_OP.addGoal,
			matchId: 7,
			scorerPlayerId: 102,
			assistPlayerId: null,
			isOwnGoal: false,
			elapsedSeconds: 1,
		},
		10,
		nowMs,
	),
];
check(pendingLocalGoalOpId(queued, -10), "10", "finds local addGoal");
check(pendingLocalGoalOpId(queued, -1), null, "setPlayer is not a goal");

check(
	isFatalMatchOpMessage(EVENT_ERROR_MESSAGE["player not in match"]),
	true,
	"translated business error is fatal",
);
check(isFatalMatchOpMessage("Failed to fetch"), false, "network is not fatal");

function teamPlayer(
	partial: Pick<
		ChampionshipEventTeamPlayer,
		"id" | "player_id" | "display_name"
	> &
		Partial<ChampionshipEventTeamPlayer>,
): ChampionshipEventTeamPlayer {
	return {
		event_id: 1,
		team_id: 10,
		is_goalkeeper: false,
		...partial,
	};
}

function eventTeam(
	partial: Pick<ChampionshipEventTeam, "id" | "players"> &
		Partial<ChampionshipEventTeam>,
): ChampionshipEventTeam {
	return {
		event_id: 1,
		color: EVENT_TEAM_COLOR.white,
		sort_order: 1,
		is_active: true,
		template_player_ids: partial.players.map((player) => player.player_id),
		template_goalkeeper_id:
			partial.players.find((player) => player.is_goalkeeper)?.player_id ?? 0,
		...partial,
	};
}

const teamA = eventTeam({
	id: 10,
	sort_order: 1,
	players: [
		teamPlayer({
			id: 1,
			player_id: 100,
			display_name: "Ana",
			is_goalkeeper: true,
		}),
		teamPlayer({ id: 2, player_id: 101, display_name: "Beto" }),
	],
});
const teamB = eventTeam({
	id: 20,
	sort_order: 2,
	color: EVENT_TEAM_COLOR.black,
	players: [
		teamPlayer({
			id: 3,
			team_id: 20,
			player_id: 200,
			display_name: "Caio",
			is_goalkeeper: true,
		}),
	],
});
const teamC = eventTeam({
	id: 30,
	sort_order: 3,
	color: EVENT_TEAM_COLOR.red,
	players: [
		teamPlayer({
			id: 4,
			team_id: 30,
			player_id: 300,
			display_name: "Duda",
			is_goalkeeper: true,
		}),
	],
});

const baseEvent: ChampionshipEvent = {
	id: 1,
	championship_id: 1,
	starts_at: "2026-08-20T12:00:00.000Z",
	players_per_team: 5,
	skip_guest_goalkeeper_matches: false,
	ended_at: null,
	attendance: [],
	rsvps: [],
	teams: [teamA, teamB, teamC],
	matches: [],
};

const started = applyPlayOps(baseEvent, [
	buildMatchOp(
		{
			kind: MATCH_OP.startMatch,
			eventId: 1,
			teamAId: 10,
			teamBId: 20,
			durationSeconds: 420,
		},
		11,
		nowMs,
	),
]);
const localMatch = started.matches[0];
check(started.matches.length, 1, "start appends match");
check(localMatch?.id, -11, "start uses localId as match id");
check(localMatch?.ended_at, null, "start leaves match open");
check(localMatch?.duration_seconds, 420, "start copies duration");
check(localMatch?.pause_accumulated_seconds, 0, "start clock is idle");
check(localMatch?.goals.length, 0, "start has no goals");
const startedAna = localMatch?.players.find(
	(player) => player.player_id === 100,
);
const startedBeto = localMatch?.players.find(
	(player) => player.player_id === 101,
);
const startedCaio = localMatch?.players.find(
	(player) => player.player_id === 200,
);
check(startedAna?.slot, 0, "start keeper occupies slot 0");
check(startedAna?.is_goalkeeper, true, "start keeper flag");
check(startedBeto?.slot, 1, "start field player occupies slot 1");
check(startedCaio?.team_id, 20, "start copies team B players");

const startNoop = applyPlayOps(started, [
	buildMatchOp(
		{
			kind: MATCH_OP.startMatch,
			eventId: 1,
			teamAId: 10,
			teamBId: 30,
			durationSeconds: 300,
		},
		12,
		nowMs,
	),
]);
check(startNoop, started, "start with open match is noop");

const swappedEvent = applyPlayOps(started, [
	buildMatchOp(
		{
			kind: MATCH_OP.swapTeam,
			matchId: -11,
			outgoingTeamId: 20,
			incomingTeamId: 30,
		},
		13,
		nowMs,
	),
]);
const swappedMatch = swappedEvent.matches[0];
check(swappedMatch?.team_b_id, 30, "swap replaces outgoing team");
check(swappedMatch?.team_a_id, 10, "swap keeps staying team");
check(swappedMatch?.goals.length, 0, "swap clears goals");
check(
	swappedMatch?.players.some((player) => player.player_id === 200),
	false,
	"swap removes outgoing roster",
);
check(
	swappedMatch?.players.some((player) => player.player_id === 300),
	true,
	"swap inserts incoming roster",
);
check(
	swappedMatch?.players.some((player) => player.player_id === 100),
	true,
	"swap keeps staying roster",
);

const endedEvent = applyPlayOps(started, [
	buildMatchOp(
		{
			kind: MATCH_OP.addGoal,
			matchId: -11,
			scorerPlayerId: 101,
			assistPlayerId: null,
			isOwnGoal: false,
			elapsedSeconds: 8,
		},
		14,
		nowMs,
	),
	buildMatchOp(
		{
			kind: MATCH_OP.endMatch,
			matchId: -11,
		},
		15,
		nowMs,
	),
]);
const endedMatch = endedEvent.matches[0];
check(endedMatch?.ended_at, "2026-08-20T12:00:00.000Z", "end fills ended_at");
check(endedMatch?.winner_team_id, 10, "end sets winner from score");

const discarded = applyPlayOps(started, [
	buildMatchOp(
		{
			kind: MATCH_OP.discardMatch,
			matchId: -11,
		},
		16,
		nowMs,
	),
]);
check(discarded.matches.length, 0, "discard removes the match");

const edited = applyPlayOps(started, [
	buildMatchOp(
		{
			kind: MATCH_OP.updateTeam,
			teamId: 10,
			color: EVENT_TEAM_COLOR.blue,
			playerIds: [100],
			goalkeeperId: 100,
			members: [
				{
					playerId: 100,
					displayName: "Ana",
					isGoalkeeper: true,
				},
			],
		},
		17,
		nowMs,
	),
]);
const editedTeam = edited.teams.find((team) => team.id === 10);
check(editedTeam?.color, EVENT_TEAM_COLOR.blue, "updateTeam changes color");
check(editedTeam?.players.length, 1, "updateTeam replaces members");
check(
	edited.matches[0]?.players.length,
	started.matches[0]?.players.length,
	"updateTeam leaves match players",
);

console.log("championship-event-match-ops ok");
