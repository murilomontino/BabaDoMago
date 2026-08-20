import type {
	ChampionshipEventGoal,
	ChampionshipEventMatchPlayer,
} from "../types/championship-event.ts";
import { EVENT_ERROR_MESSAGE } from "./championship-event.ts";
import {
	applyMatchOp,
	applyMatchOps,
	buildMatchOp,
	isFatalMatchOpMessage,
	MATCH_OP,
	type MatchOp,
	pendingLocalGoalOpId,
} from "./championship-event-match-ops.ts";

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

const swapped = applyMatchOp(
	baseMatch,
	buildMatchOp(
		{
			kind: MATCH_OP.setGoalkeeper,
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

console.log("championship-event-match-ops ok");
