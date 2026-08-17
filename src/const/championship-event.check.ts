import {
	ATTENDANCE_SEED,
	ATTENDANCE_STATS_TEAM_FILTER,
	ATTENDANCE_STATS_TEAM_FILTER_LABEL,
	applyVisibleAttendance,
	areAllVisiblePresent,
	attendanceGoalkeeperIds,
	builderTeamsFromDrafts,
	builderTeamsFromEvent,
	builderTeamsHavePlayers,
	CHAMPIONSHIP_EVENT,
	canAddEventMatch,
	canEditEventTeams,
	canRemoveEventAttendance,
	canSelfCheckIn,
	canStartEventMatch,
	championshipEventErrorMessage,
	compareByAttendanceCount,
	countPlayerAttendance,
	defaultGoalkeeperIds,
	draftAttendanceForEnd,
	drawBalancedEventTeams,
	EVENT_ATTENDANCE_ACTION,
	EVENT_ATTENDANCE_MESSAGE,
	EVENT_ATTENDANCE_STAT_ABBR,
	EVENT_BUILDER_STEP,
	EVENT_CONFIG_LABEL,
	EVENT_CREATE_OPEN_LABEL,
	EVENT_ERROR_MESSAGE,
	EVENT_RSVP_STATUS,
	EVENT_TEAM_MESSAGE,
	EVENT_TEAM_POSITION,
	EVENT_TEAM_POSITION_LABEL,
	EVENT_WEEKDAY,
	EVENT_WEEKDAY_LABEL,
	type EventTeamDraft,
	emptyTeamSlots,
	eventDateYmd,
	eventDrawRatings,
	eventGoalkeeperIds,
	eventIsoWeekday,
	eventListActionFlags,
	eventTeamByPlayerId,
	eventTeamCount,
	eventTeamPlayerIds,
	eventTeamPlayerOptionLabel,
	eventTeamPlayerPosition,
	eventTeamRatingAverage,
	eventTeamSlotPosition,
	filterAttendanceByTeam,
	formatChampionshipSchedule,
	formatEventTeamRatingAverage,
	formatEventTimeShort,
	formatNextPeladaShortcut,
	hasEventListActions,
	initialBuilderTeams,
	isEventBuilderStep,
	isEventRsvpStatus,
	isMatchAlreadyOpenError,
	isoWeekdayFromYmd,
	keepGoalkeepersPresent,
	keepPresentSlots,
	keepTeamPlayersPresent,
	matchPlayerIdsMissingFromAttendance,
	mergePresentIdsForEnd,
	nextEventDate,
	nextEventTeamColor,
	openChampionshipEvents,
	PLAYER_EVENT_STAT_META,
	parseAttendanceStatInput,
	parseChampionshipLocation,
	parseEventWeekday,
	pickTeamGoalkeeper,
	playerEventStatsFromAttendance,
	resizeBuilderTeams,
	rsvpGoingPlayerIds,
	seedPresentIdsFromHistory,
	setAttendanceStat,
	setGoalkeeperSelection,
	setPlayerEventStat,
	sortAttendanceByTeam,
	teamHasMatches,
	teamPlayerSlots,
	teamSlotsToPlayerIds,
	validateEventAttendance,
	validateEventAttendanceStats,
	validateEventTeam,
	validateEventTeams,
	validatePlayerEventStats,
	validateTeamsInAttendance,
} from "./championship-event.ts";
import { EVENT_TEAM_COLOR, type EventTeamColor } from "./event-team-color.ts";
import { PLAYER_RATING } from "./player-rating.ts";

function check(actual: unknown, expected: unknown): void {
	if (actual !== expected) {
		throw new Error(`expected ${String(expected)}, got ${String(actual)}`);
	}
}

check(EVENT_CONFIG_LABEL.skipGuestGoalkeeperMatches, "Goleiro de outro time");
check(EVENT_CONFIG_LABEL.eventWeekday, "Dia da semana");
check(EVENT_CONFIG_LABEL.location, "Local");
check(CHAMPIONSHIP_EVENT.skipGuestGoalkeeperMatchesDefault, true);
check(CHAMPIONSHIP_EVENT.locationMaxLength, 120);
check(EVENT_WEEKDAY_LABEL[EVENT_WEEKDAY.tuesday], "terça");
check(isoWeekdayFromYmd("2026-08-17"), EVENT_WEEKDAY.monday);
check(isoWeekdayFromYmd("2026-08-18"), EVENT_WEEKDAY.tuesday);
check(nextEventDate(EVENT_WEEKDAY.tuesday, "2026-08-17"), "2026-08-18");
check(nextEventDate(EVENT_WEEKDAY.tuesday, "2026-08-18"), "2026-08-18");
check(nextEventDate(EVENT_WEEKDAY.monday, "2026-08-16"), "2026-08-17");
check(nextEventDate(EVENT_WEEKDAY.sunday, "2026-08-17"), "2026-08-23");
check(formatEventTimeShort("19:00:00"), "19h");
check(formatEventTimeShort("19:30"), "19h30");
check(
	formatNextPeladaShortcut({
		weekday: EVENT_WEEKDAY.tuesday,
		eventTime: "19:00",
	}),
	"Criar terça, 19h",
);
check(
	formatChampionshipSchedule({
		weekday: EVENT_WEEKDAY.tuesday,
		eventTime: "19:00",
		location: "Society do parque",
	}),
	"Terça · 19h · Society do parque",
);
check(parseEventWeekday(2), EVENT_WEEKDAY.tuesday);
check(parseEventWeekday(0), null);
check(parseChampionshipLocation("  campo 2  "), "campo 2");
check(parseChampionshipLocation("   "), null);
check(EVENT_CREATE_OPEN_LABEL.title, "Rodadas em aberto");
check(EVENT_CREATE_OPEN_LABEL.hint.includes("MVP automático"), true);
check(EVENT_CREATE_OPEN_LABEL.closeAndCreate, "Encerrar e criar");
check(EVENT_CREATE_OPEN_LABEL.createOnly, "Criar sem encerrar");
check(
	openChampionshipEvents([
		{ id: 2, starts_at: "2026-08-15T22:00:00.000Z", ended_at: null },
		{ id: 1, starts_at: "2026-08-15T19:00:00.000Z", ended_at: null },
		{ id: 3, starts_at: "2026-08-14T19:00:00.000Z", ended_at: "2026-08-14" },
	])
		.map((event) => event.id)
		.join(","),
	"1,2",
);
check(
	openChampionshipEvents([
		{ id: 2, starts_at: "2026-08-15T19:00:00.000Z", ended_at: null },
		{ id: 1, starts_at: "2026-08-15T19:00:00.000Z", ended_at: null },
	])
		.map((event) => event.id)
		.join(","),
	"1,2",
);

function draft(
	color: EventTeamDraft["color"],
	playerIds: number[],
	goalkeeperId = playerIds[0] ?? 0,
): EventTeamDraft {
	return { color, playerIds, goalkeeperId };
}

check(validateEventTeams([], 5), EVENT_TEAM_MESSAGE.minTeams);

check(
	validateEventTeams(
		[draft(EVENT_TEAM_COLOR.white, [1]), draft(EVENT_TEAM_COLOR.black, [2])],
		5,
	),
	null,
);

check(validateEventTeams([draft(null, [1]), draft(null, [2])], 5), null);

check(
	validateEventTeams(
		[draft("#7c3aed", [1]), draft(EVENT_TEAM_COLOR.black, [2])],
		5,
	),
	null,
);

check(
	validateEventTeams([draft("#7c3aed", [1]), draft("#7c3aed", [2])], 5),
	EVENT_TEAM_MESSAGE.colorDuplicate,
);

check(
	validateEventTeams(
		[draft("white" as EventTeamColor, [1]), draft(EVENT_TEAM_COLOR.black, [2])],
		5,
	),
	EVENT_TEAM_MESSAGE.colorInvalid,
);

check(
	validateEventTeams(
		[draft(EVENT_TEAM_COLOR.white, [1]), draft(EVENT_TEAM_COLOR.white, [2])],
		5,
	),
	EVENT_TEAM_MESSAGE.colorDuplicate,
);

check(
	validateEventTeams(
		[draft(EVENT_TEAM_COLOR.white, [1]), draft(EVENT_TEAM_COLOR.black, [1])],
		5,
	),
	EVENT_TEAM_MESSAGE.playerDuplicate,
);

check(
	validateEventTeams(
		[draft(EVENT_TEAM_COLOR.white, []), draft(EVENT_TEAM_COLOR.black, [2])],
		5,
	),
	EVENT_TEAM_MESSAGE.playerEmpty,
);

check(
	validateEventTeams(
		[
			draft(EVENT_TEAM_COLOR.white, [1, 2, 3]),
			draft(EVENT_TEAM_COLOR.black, [4]),
		],
		2,
	),
	EVENT_TEAM_MESSAGE.playerLimit,
);

check(
	validateEventTeams(
		[
			draft(EVENT_TEAM_COLOR.white, [1, 2], 9),
			draft(EVENT_TEAM_COLOR.black, [3]),
		],
		5,
	),
	EVENT_TEAM_MESSAGE.goalkeeperMissing,
);

check(
	validateEventTeams(
		[
			draft(EVENT_TEAM_COLOR.white, [1, 2, 3, 4], 0),
			draft(EVENT_TEAM_COLOR.black, [5, 6, 7, 8], 0),
		],
		5,
	),
	null,
);

check(
	validateEventAttendance([1], [1, 2, 3]),
	EVENT_ATTENDANCE_MESSAGE.minPresent,
);
check(
	validateEventTeam(
		draft(EVENT_TEAM_COLOR.white, [1, 2]),
		5,
		[],
		[],
		[1, 2, 3],
	),
	null,
);
check(validateEventTeam(draft(null, [1, 2]), 5, [], [], [1, 2, 3]), null);
check(
	validateEventTeam(draft(null, [1]), 5, [EVENT_TEAM_COLOR.white], [], [1, 2]),
	null,
);
check(
	validateEventTeam(
		draft(EVENT_TEAM_COLOR.white, [1]),
		5,
		[EVENT_TEAM_COLOR.white],
		[],
		[1, 2],
	),
	EVENT_TEAM_MESSAGE.colorDuplicate,
);
check(
	validateEventTeam(draft(EVENT_TEAM_COLOR.white, [1]), 5, [], [1], [1, 2]),
	EVENT_TEAM_MESSAGE.playerDuplicate,
);
check(
	validateEventTeam(draft(EVENT_TEAM_COLOR.white, [9]), 5, [], [], [1, 2]),
	EVENT_TEAM_MESSAGE.playerNotPresent,
);

check(validateEventAttendance([1, 2], [1, 2, 3]), null);

check(
	validateEventAttendance([1, 9], [1, 2, 3]),
	EVENT_ATTENDANCE_MESSAGE.notInRoster,
);

check(
	validateEventAttendance([1, 1], [1, 2, 3]),
	EVENT_ATTENDANCE_MESSAGE.duplicate,
);

check(
	validateTeamsInAttendance(
		[draft(EVENT_TEAM_COLOR.white, [1]), draft(EVENT_TEAM_COLOR.black, [2])],
		[1, 2, 3],
	),
	null,
);

check(
	validateTeamsInAttendance(
		[draft(EVENT_TEAM_COLOR.white, [1]), draft(EVENT_TEAM_COLOR.black, [9])],
		[1, 2, 3],
	),
	EVENT_TEAM_MESSAGE.playerNotPresent,
);

const attendanceCounts = countPlayerAttendance([
	{ attendance: [{ player_id: 1 }, { player_id: 2 }] },
	{ attendance: [{ player_id: 1 }] },
]);
check(attendanceCounts.get(1), 2);
check(attendanceCounts.get(2), 1);
check(attendanceCounts.get(3), undefined);

check(
	compareByAttendanceCount(
		{ attendanceCount: 1, display_name: "Ana" },
		{ attendanceCount: 3, display_name: "Bia" },
	) > 0,
	true,
);

check(emptyTeamSlots(3).join(","), ",,");
check(builderTeamsHavePlayers(initialBuilderTeams(5, 2)), false);
check(
	builderTeamsHavePlayers([
		{ key: "a", color: null, slots: ["", "1"] },
		{ key: "b", color: null, slots: ["", ""] },
	]),
	true,
);
check(eventTeamCount(16, 5), 4);
check(eventTeamCount(15, 5), 3);
check(eventTeamCount(31, 10), 4);
check(eventTeamCount(2, 5), 2);
check(eventTeamCount(0, 5), 2);
check(eventTeamRatingAverage([]), 0);
check(eventTeamRatingAverage([10, 7, 6, 3]), 6.5);
check(eventTeamRatingAverage([10, PLAYER_RATING.default, 8]), 9);
check(eventTeamRatingAverage([10, PLAYER_RATING.default], [10, 8, 0]), 9.5);
check(eventTeamRatingAverage([0, 0], [0, 0, 10, 8]), 9);
check(formatEventTeamRatingAverage(6.5), "6.5");
check(initialBuilderTeams(2).length, 2);
check(initialBuilderTeams(5, 4).length, 4);
check(builderTeamsFromEvent([], 5, 16).length, 4);
check(
	initialBuilderTeams(5, 4).every((team) => team.color === null),
	true,
);
check(
	resizeBuilderTeams(initialBuilderTeams(5, 2), 4, 5, new Set([1, 2])).length,
	4,
);
check(keepPresentSlots(["1", "9", ""], new Set([1, 2])).join("|"), "1||");
check(nextEventTeamColor([EVENT_TEAM_COLOR.white]), EVENT_TEAM_COLOR.black);
check(
	builderTeamsFromEvent(
		[
			{
				id: 10,
				color: EVENT_TEAM_COLOR.white,
				players: [
					{ player_id: 2, is_goalkeeper: false },
					{ player_id: 1, is_goalkeeper: true },
				],
			},
			{
				id: 11,
				color: EVENT_TEAM_COLOR.black,
				players: [{ player_id: 3, is_goalkeeper: true }],
			},
		],
		3,
	)
		.map((team) => team.slots.join("|"))
		.join("/"),
	"1|2|/3||",
);
check(
	builderTeamsFromDrafts(
		[
			{
				color: EVENT_TEAM_COLOR.white,
				playerIds: [1, 2],
				goalkeeperId: 1,
			},
			{
				color: EVENT_TEAM_COLOR.black,
				playerIds: [3],
				goalkeeperId: 3,
			},
		],
		3,
	)
		.map((team) => team.slots.join("|"))
		.join("/"),
	"1|2|/3||",
);
check(
	builderTeamsFromDrafts(
		[
			{
				color: EVENT_TEAM_COLOR.white,
				playerIds: [1, 2, 3, 4],
				goalkeeperId: 0,
			},
		],
		5,
	)
		.map((team) => team.slots.join("|"))
		.join("/"),
	"|1|2|3|4",
);
check(canEditEventTeams({ ended_at: null, matches: [] }), true);
check(canEditEventTeams({ ended_at: "2026-08-13", matches: [] }), false);
check(canEditEventTeams({ ended_at: "2026-08-13", matches: [] }, true), true);
check(canEditEventTeams({ ended_at: null, matches: [{}] }), false);
check(
	canEditEventTeams({ ended_at: "2026-08-13", matches: [{}] }, true),
	false,
);
check(draftAttendanceForEnd(false, [1, 2]), null);
check(draftAttendanceForEnd(true, [1]), null);
check(draftAttendanceForEnd(true, [1, 2])?.join(","), "1,2");
check(
	championshipEventErrorMessage("event already ended"),
	EVENT_ERROR_MESSAGE["event already ended"],
);
check(
	championshipEventErrorMessage("event has matches"),
	EVENT_ERROR_MESSAGE["event has matches"],
);
check(
	championshipEventErrorMessage("team has matches"),
	EVENT_ERROR_MESSAGE["team has matches"],
);
check(teamHasMatches(1, [{ team_a_id: 1, team_b_id: 2 }]), true);
check(teamHasMatches(3, [{ team_a_id: 1, team_b_id: 2 }]), false);
check(
	teamPlayerSlots(
		[
			{ player_id: 2, is_goalkeeper: false },
			{ player_id: 1, is_goalkeeper: true },
		],
		3,
	).join("|"),
	"1|2|",
);
check(String(teamSlotsToPlayerIds(["1", "", "2"])), "1,2");
check(eventTeamSlotPosition(0), EVENT_TEAM_POSITION.goalkeeper);
check(eventTeamSlotPosition(1), EVENT_TEAM_POSITION.player);
check(eventTeamPlayerPosition(true), EVENT_TEAM_POSITION.goalkeeper);
check(eventTeamPlayerPosition(false), EVENT_TEAM_POSITION.player);

check(String(applyVisibleAttendance([3], [1, 2], true)), "3,1,2");
check(String(applyVisibleAttendance([1, 2, 3], [1, 2], false)), "3");
check(String(keepGoalkeepersPresent([1, 2, 9], [1, 3])), "1");
check(String(keepGoalkeepersPresent([2, 2, 1], [1, 2])), "2,1");
check(
	String(
		defaultGoalkeeperIds([
			{ id: 1, is_goalkeeper: false },
			{ id: 2, is_goalkeeper: true },
			{ id: 3, is_goalkeeper: true },
		]),
	),
	"2,3",
);
check(String(eventGoalkeeperIds([2, 3], [3, 4])), "2,3,4");
check(String(setGoalkeeperSelection([1], [2], true)), "1,2");
check(String(setGoalkeeperSelection([1, 2], [2], false)), "1");
check(String(setGoalkeeperSelection([1], [1], true)), "1");
check(
	String(
		attendanceGoalkeeperIds([
			{ player_id: 1, is_goalkeeper: false },
			{ player_id: 2, is_goalkeeper: true },
		]),
	),
	"2",
);
check(eventTeamPlayerOptionLabel("Ana", false), "Ana");
check(
	eventTeamPlayerOptionLabel("Ana", true),
	`Ana · ${EVENT_TEAM_POSITION_LABEL.goalkeeper}`,
);
check(pickTeamGoalkeeper([1, 2, 3, 4], 5), 0);
check(pickTeamGoalkeeper([1, 2, 3, 4, 5], 5), 1);
check(pickTeamGoalkeeper([1, 2, 3, 4, 5], 5, [4]), 4);
check(pickTeamGoalkeeper([1, 2, 3, 4, 5], 5, [9, 2]), 2);
check(pickTeamGoalkeeper([], 5), 0);
check(areAllVisiblePresent([1, 2], [1, 2]), true);
check(areAllVisiblePresent([1], [1, 2]), false);
check(areAllVisiblePresent([1, 2, 3], []), false);
check(
	String(
		eventTeamPlayerIds([
			{ players: [{ player_id: 1 }, { player_id: 2 }] },
			{ players: [{ player_id: 2 }] },
		]),
	),
	"1,2",
);
check(String(keepTeamPlayersPresent([3], [1, 2])), "3,1,2");
check(canRemoveEventAttendance(3, 3, [1, 2]), true);
check(canRemoveEventAttendance(1, 3, [1, 2]), false);
check(canRemoveEventAttendance(3, 2, []), false);
check(
	canAddEventMatch({
		ended: false,
		teamCount: 2,
	}),
	true,
);
check(
	canAddEventMatch({
		ended: true,
		teamCount: 2,
	}),
	false,
);
check(
	canAddEventMatch({
		ended: false,
		teamCount: 2,
	}),
	true,
);
check(
	canAddEventMatch({
		ended: true,
		teamCount: 2,
	}),
	false,
);
check(canStartEventMatch({ ended: false, teamCount: 2 }), true);
check(canStartEventMatch({ ended: true, teamCount: 2 }), false);
check(
	hasEventListActions(
		eventListActionFlags({
			canManage: false,
			canSetMvp: false,
			ended: true,
			teamCount: 1,
			attendanceCount: 0,
		}),
	),
	false,
);
check(
	eventListActionFlags({
		canManage: true,
		canSetMvp: false,
		ended: false,
		teamCount: 2,
		attendanceCount: 4,
	}).canEnd,
	true,
);
check(
	eventListActionFlags({
		canManage: false,
		canSetMvp: true,
		ended: true,
		teamCount: 2,
		attendanceCount: 3,
	}).canSetMvp,
	true,
);
check(
	canAddEventMatch({
		ended: true,
		teamCount: 1,
	}),
	false,
);

const rated = [
	{ id: 1, rating: 10 },
	{ id: 2, rating: 9 },
	{ id: 3, rating: 8 },
	{ id: 4, rating: 7 },
	{ id: 5, rating: 6 },
	{ id: 6, rating: 5 },
	{ id: 7, rating: 4 },
	{ id: 8, rating: 3 },
] as const;
const drawn = drawBalancedEventTeams(rated, 5, () => 0.999);
check(drawn.length, 2);
check(drawn[0]?.color, null);
check(drawn[1]?.color, null);
check(String(drawn[0]?.playerIds), "1,4,5,8");
check(String(drawn[1]?.playerIds), "2,3,6,7");
check(drawn[0]?.goalkeeperId, 0);
check(drawn[1]?.goalkeeperId, 0);
check(
	validateEventTeams(drawn, 5) ??
		validateTeamsInAttendance(
			drawn,
			rated.map((player) => player.id),
		),
	null,
);
const drawnAvg = (playerIds: readonly number[]) =>
	playerIds.reduce((sum, id) => {
		const player = rated.find((item) => item.id === id);
		return sum + (player?.rating ?? 0);
	}, 0) / playerIds.length;
check(drawnAvg(drawn[0]?.playerIds ?? []), 6.5);
check(drawnAvg(drawn[1]?.playerIds ?? []), 6.5);
const leftover = drawBalancedEventTeams(rated.slice(0, 5), 3, () => 0.999);
check(leftover.length, 2);
check(
	leftover
		.flatMap((team) => team.playerIds)
		.sort((a, b) => a - b)
		.join(","),
	"1,2,3,4,5",
);
check(
	leftover.every((team) => team.playerIds.length <= 3),
	true,
);
check(
	leftover.every((team) =>
		team.playerIds.length < 3
			? team.goalkeeperId === 0
			: team.playerIds.includes(team.goalkeeperId) && team.goalkeeperId !== 0,
	),
	true,
);
const fullRated = [
	...rated,
	{ id: 9, rating: 2 },
	{ id: 10, rating: 1 },
] as const;
const fullDrawn = drawBalancedEventTeams(fullRated, 5, () => 0.999);
check(fullDrawn.length, 2);
check(
	fullDrawn.every(
		(team) =>
			team.playerIds.length === 5 && team.goalkeeperId === team.playerIds[0],
	),
	true,
);
const volunteerDrawn = drawBalancedEventTeams(fullRated, 5, () => 0.999, [8]);
check(
	volunteerDrawn.some(
		(team) => team.playerIds.includes(8) && team.goalkeeperId === 8,
	),
	true,
);
check(
	volunteerDrawn.every((team) =>
		team.playerIds.includes(8)
			? team.goalkeeperId === 8
			: team.goalkeeperId === team.playerIds[0],
	),
	true,
);

check(
	eventDrawRatings([
		{ id: 1, rating: 10 },
		{ id: 2, rating: PLAYER_RATING.default },
		{ id: 3, rating: 8 },
	])
		.map((player) => player.rating)
		.join(","),
	"10,9,8",
);
const allUnset = [
	{ id: 1, rating: PLAYER_RATING.default },
	{ id: 2, rating: PLAYER_RATING.default },
	{ id: 3, rating: PLAYER_RATING.default },
	{ id: 4, rating: PLAYER_RATING.default },
] as const;
check(
	eventDrawRatings(allUnset)
		.map((player) => player.rating)
		.join(","),
	"0,0,0,0",
);
const drawnAllUnset = drawBalancedEventTeams(allUnset, 3, () => 0.999);
check(drawnAllUnset.length, 2);
check(
	drawnAllUnset
		.flatMap((team) => team.playerIds)
		.sort((left, right) => left - right)
		.join(","),
	"1,2,3,4",
);
const drawnUnset = drawBalancedEventTeams(
	[
		{ id: 1, rating: 10 },
		{ id: 2, rating: 8 },
		{ id: 3, rating: 6 },
		{ id: 4, rating: 4 },
		{ id: 5, rating: 2 },
		{ id: 6, rating: PLAYER_RATING.default },
	],
	3,
	() => 0.999,
);
check(
	drawnUnset.some((team) => {
		const ids = team.playerIds;
		return ids.includes(6) && ids.includes(1);
	}),
	true,
);

check(isEventBuilderStep(EVENT_BUILDER_STEP.attendance), true);
check(isEventBuilderStep(EVENT_BUILDER_STEP.teams), true);
check(isEventBuilderStep("nope"), false);
check(isEventBuilderStep(null), false);
check(EVENT_ATTENDANCE_ACTION.addPlayer, "Adicionar");
check(EVENT_ATTENDANCE_ACTION.addPlayerPlaceholder, "Nome do jogador");
check(EVENT_ATTENDANCE_ACTION.addPlayerAria, "Adicionar jogador");
check(EVENT_ATTENDANCE_STAT_ABBR.goals, "G");
check(EVENT_ATTENDANCE_STAT_ABBR.assistedGoals, "GS");
check(EVENT_ATTENDANCE_STAT_ABBR.ownGoals, "GC");

const statsDraft = [
	{
		player_id: 1,
		goals: 2,
		assists: 1,
		own_goals: 0,
		wins: 1,
		losses: 1,
		draws: 0,
		matches: 2,
	},
	{
		player_id: 2,
		goals: 0,
		assists: 0,
		own_goals: 0,
		wins: 0,
		losses: 2,
		draws: 0,
		matches: 2,
	},
];
check(validateEventAttendanceStats(statsDraft, [1, 2]), null);
check(
	validateEventAttendanceStats(statsDraft, [1]),
	EVENT_ATTENDANCE_MESSAGE.invalidStats,
);
check(
	validateEventAttendanceStats(
		[{ ...statsDraft[0], wins: 3, matches: 2 }, statsDraft[1]],
		[1, 2],
	),
	EVENT_ATTENDANCE_MESSAGE.winsExceedMatches,
);
check(
	validateEventAttendanceStats(
		[{ ...statsDraft[0], losses: 0, draws: 0 }, statsDraft[1]],
		[1, 2],
	),
	null,
);
check(
	validateEventAttendanceStats(
		[{ ...statsDraft[0], losses: 2, draws: 0 }, statsDraft[1]],
		[1, 2],
	),
	EVENT_ATTENDANCE_MESSAGE.resultStatsMismatch,
);
check(
	validateEventAttendanceStats(
		[{ ...statsDraft[0], goals: -1 }, statsDraft[1]],
		[1, 2],
	),
	EVENT_ATTENDANCE_MESSAGE.invalidStats,
);
check(parseAttendanceStatInput(""), 0);
check(parseAttendanceStatInput("4"), 4);
check(parseAttendanceStatInput("-1"), null);
check(setAttendanceStat(statsDraft, 1, "goals", 9)[0]?.goals, 9);
check(ATTENDANCE_STATS_TEAM_FILTER_LABEL.all, "Todos");
check(ATTENDANCE_STATS_TEAM_FILTER_LABEL.none, "Sem time");
const statsByTeam = eventTeamByPlayerId([
	{
		id: 20,
		color: EVENT_TEAM_COLOR.blue,
		sort_order: 1,
		players: [{ player_id: 2 }, { player_id: 3 }],
	},
	{
		id: 10,
		color: EVENT_TEAM_COLOR.red,
		sort_order: 0,
		players: [{ player_id: 4 }, { player_id: 1 }],
	},
]);
check(statsByTeam.get(1)?.color, EVENT_TEAM_COLOR.red);
check(statsByTeam.get(1)?.slot, 1);
check(statsByTeam.get(1)?.team_id, 10);
check(statsByTeam.get(2)?.color, EVENT_TEAM_COLOR.blue);
const statsPlayers = [
	{ player_id: 2 },
	{ player_id: 5 },
	{ player_id: 1 },
	{ player_id: 4 },
	{ player_id: 3 },
];
check(
	sortAttendanceByTeam(statsPlayers, statsByTeam)
		.map((row) => row.player_id)
		.join(","),
	"4,1,2,3,5",
);
check(
	filterAttendanceByTeam(
		statsPlayers,
		statsByTeam,
		ATTENDANCE_STATS_TEAM_FILTER.all,
	)
		.map((row) => row.player_id)
		.join(","),
	"2,5,1,4,3",
);
check(
	filterAttendanceByTeam(statsPlayers, statsByTeam, 10)
		.map((row) => row.player_id)
		.join(","),
	"1,4",
);
check(
	filterAttendanceByTeam(
		statsPlayers,
		statsByTeam,
		ATTENDANCE_STATS_TEAM_FILTER.none,
	)
		.map((row) => row.player_id)
		.join(","),
	"5",
);
check(
	championshipEventErrorMessage("invalid attendance stats"),
	EVENT_ERROR_MESSAGE["invalid attendance stats"],
);
check(
	championshipEventErrorMessage("result stats mismatch"),
	EVENT_ERROR_MESSAGE["result stats mismatch"],
);
check(
	championshipEventErrorMessage("invalid rating"),
	EVENT_ERROR_MESSAGE["invalid rating"],
);
check(
	championshipEventErrorMessage("event still open"),
	EVENT_ERROR_MESSAGE["event still open"],
);
check(
	championshipEventErrorMessage("no goal to undo"),
	EVENT_ERROR_MESSAGE["no goal to undo"],
);
check(
	championshipEventErrorMessage("goal not found"),
	EVENT_ERROR_MESSAGE["goal not found"],
);
check(
	championshipEventErrorMessage("player substituted"),
	EVENT_ERROR_MESSAGE["player substituted"],
);
check(
	championshipEventErrorMessage("match already open"),
	EVENT_ERROR_MESSAGE["match already open"],
);
check(isMatchAlreadyOpenError("match already open"), true);
check(isMatchAlreadyOpenError(EVENT_ERROR_MESSAGE["match already open"]), true);
check(isMatchAlreadyOpenError("match already ended"), false);

const playerEventDraft = playerEventStatsFromAttendance({
	goals: 2,
	assists: 1,
	wins: 4,
	losses: 2,
	draws: 0,
	matches: 6,
});
check(playerEventDraft.goals, 2);
check(playerEventDraft.assists, 1);
check(playerEventDraft.wins, 4);
check(playerEventDraft.losses, 2);
check(playerEventDraft.draws, 0);
check(playerEventDraft.matches, 6);
check(playerEventStatsFromAttendance(null).matches, 0);
check(setPlayerEventStat(playerEventDraft, "goals", 9).goals, 9);
check(validatePlayerEventStats(playerEventDraft), null);
check(
	validatePlayerEventStats({ ...playerEventDraft, wins: 7 }),
	EVENT_ATTENDANCE_MESSAGE.winsExceedMatches,
);
check(
	validatePlayerEventStats({ ...playerEventDraft, losses: 0, draws: 0 }),
	null,
);
check(
	validatePlayerEventStats({ ...playerEventDraft, goals: -1 }),
	EVENT_ATTENDANCE_MESSAGE.invalidStats,
);
check(PLAYER_EVENT_STAT_META.length, 6);
check(
	PLAYER_EVENT_STAT_META.map((field) => field.id).join(","),
	"goals,assists,wins,losses,draws,matches",
);

const seedEvents = [
	{
		id: 2,
		ended_at: "2026-08-10T22:00:00Z",
		starts_at: "2026-08-10T22:00:00Z",
		attendance: [{ player_id: 1 }, { player_id: 2 }],
	},
	{
		id: 1,
		ended_at: "2026-08-03T22:00:00Z",
		starts_at: "2026-08-03T22:00:00Z",
		attendance: [{ player_id: 1 }, { player_id: 3 }],
	},
];
check(
	seedPresentIdsFromHistory(
		ATTENDANCE_SEED.lastEvent,
		seedEvents,
		[1, 2, 3, 4],
	).join(","),
	"1,2",
);
check(
	seedPresentIdsFromHistory(
		ATTENDANCE_SEED.habitual,
		seedEvents,
		[1, 2, 3, 4],
	).join(","),
	"1,2,3",
);
check(
	seedPresentIdsFromHistory(ATTENDANCE_SEED.clear, seedEvents, [1, 2]).join(
		",",
	),
	"",
);
check(
	matchPlayerIdsMissingFromAttendance(
		[{ players: [{ player_id: 1 }, { player_id: 9 }] }],
		[1, 2],
	).join(","),
	"9",
);
check(mergePresentIdsForEnd([1, 2], [1, 2], [9])?.join(","), "1,2,9");
check(mergePresentIdsForEnd(null, [1, 2], [9])?.join(","), "1,2,9");
check(mergePresentIdsForEnd([1, 2], [1, 2], [])?.join(","), "1,2");
check(mergePresentIdsForEnd(null, [1], []), null);
check(
	rsvpGoingPlayerIds([{ player_id: 1, status: EVENT_RSVP_STATUS.going }]).join(
		",",
	),
	"1",
);
check(isEventRsvpStatus(EVENT_RSVP_STATUS.out), true);
check(isEventRsvpStatus("maybe"), false);
check(
	canSelfCheckIn({
		endedAt: null,
		startsAt: `${eventDateYmd("2026-08-17T22:00:00-03:00")}T22:00:00-03:00`,
		playerId: 1,
		attendanceIds: [],
		todayYmd: eventDateYmd("2026-08-17T22:00:00-03:00"),
	}),
	true,
);
check(
	canSelfCheckIn({
		endedAt: null,
		startsAt: "2026-08-17T22:00:00-03:00",
		playerId: 1,
		attendanceIds: [1],
		todayYmd: eventDateYmd("2026-08-17T22:00:00-03:00"),
	}),
	false,
);
check(typeof eventIsoWeekday("2026-08-17T22:00:00-03:00"), "number");

console.log("championship-event ok");
