import {
	ROUND_TAB_UI_INITIAL,
	isRoundTabModalType,
	championshipEventRoundTabUiReducer,
	roundTabModalMatch,
	roundTabModalPlayer,
	roundTabModalTeam,
} from "./championship-event-round-tab-ui.ts";
import type {
	ChampionshipPlayer,
} from "@/types/championship";
import type {
	ChampionshipEventMatch,
	ChampionshipEventTeam,
} from "@/types/championship-event";

function check(actual: unknown, expected: unknown): void {
	if (actual !== expected) {
		throw new Error(`expected ${String(expected)}, got ${String(actual)}`);
	}
}

const team: ChampionshipEventTeam = {
	id: 1,
	event_id: 11,
	color: "#0ea5e9",
	sort_order: 1,
	is_active: true,
	template_player_ids: [],
	template_goalkeeper_id: 0,
	players: [],
};

const player: ChampionshipPlayer = {
	id: 2,
	championship_id: 99,
	user_id: null,
	display_name: "Player",
	nickname: null,
	nickname_tags: [],
	avatar_url: null,
	rating: 0,
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

const match: ChampionshipEventMatch = {
	id: 3,
	event_id: 11,
	team_a_id: 1,
	team_b_id: 2,
	created_at: "2026-09-08T00:00:00Z",
	ended_at: null,
	winner_team_id: null,
	duration_seconds: 3600,
	started_at: null,
	paused_at: null,
	pause_accumulated_seconds: 0,
	players: [],
	goals: [],
};

{
	check(ROUND_TAB_UI_INITIAL.modal.type, "none");
	check(ROUND_TAB_UI_INITIAL.share.teams.isSharing, false);
	check(ROUND_TAB_UI_INITIAL.share.recap.error, null);
}

{
	const started = championshipEventRoundTabUiReducer(ROUND_TAB_UI_INITIAL, {
		type: "shareTeams/start",
	});
	check(started.share.teams.isSharing, true);
	check(started.share.teams.error, null);

	const failed = championshipEventRoundTabUiReducer(started, {
		type: "shareTeams/fail",
		error: "boom",
	});
	check(failed.share.teams.isSharing, false);
	check(failed.share.teams.error, "boom");

	const done = championshipEventRoundTabUiReducer(failed, {
		type: "shareTeams/done",
	});
	check(done.share.teams.isSharing, false);
	check(done.share.teams.error, null);
}

{
	const started = championshipEventRoundTabUiReducer(ROUND_TAB_UI_INITIAL, {
		type: "shareRecap/start",
	});
	check(started.share.recap.isSharing, true);
	check(started.share.recap.error, null);

	const failed = championshipEventRoundTabUiReducer(started, {
		type: "shareRecap/fail",
		error: "boom",
	});
	check(failed.share.recap.isSharing, false);
	check(failed.share.recap.error, "boom");

	const done = championshipEventRoundTabUiReducer(failed, {
		type: "shareRecap/done",
	});
	check(done.share.recap.isSharing, false);
	check(done.share.recap.error, null);
}

{
	const opened = championshipEventRoundTabUiReducer(ROUND_TAB_UI_INITIAL, {
		type: "modal/open",
		modal: { type: "mvp" },
	});
	check(opened.modal.type, "mvp");

	const replaced = championshipEventRoundTabUiReducer(opened, {
		type: "modal/open",
		modal: { type: "removeMatch", match },
	});
	check(replaced.modal.type, "removeMatch");
	check(roundTabModalMatch(replaced.modal)?.id, match.id);
	check(isRoundTabModalType(replaced.modal, "removeMatch"), true);

	const closed = championshipEventRoundTabUiReducer(replaced, {
		type: "modal/close",
	});
	check(closed.modal.type, "none");
}

{
	const copiedDraw = championshipEventRoundTabUiReducer(ROUND_TAB_UI_INITIAL, {
		type: "copyDrawLink/done",
	});
	check(copiedDraw.share.copiedDrawLink, true);

	const copiedVote = championshipEventRoundTabUiReducer(copiedDraw, {
		type: "copyVoteLink/done",
	});
	check(copiedVote.share.copiedVoteLink, true);
}

{
	const teamModal = championshipEventRoundTabUiReducer(ROUND_TAB_UI_INITIAL, {
		type: "modal/open",
		modal: { type: "removeTeam", team },
	});
	check(roundTabModalTeam(teamModal.modal)?.id, team.id);

	const playerModal = championshipEventRoundTabUiReducer(teamModal, {
		type: "modal/open",
		modal: { type: "removeAttendance", player },
	});
	check(roundTabModalPlayer(playerModal.modal)?.id, player.id);
}

console.log("championship-event-round-tab-ui.check.ts: ok");
