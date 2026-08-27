import { EVENT_ACTION } from "./championship-event.ts";
import {
	copyDrawLinkLabel,
	EVENT_DRAW_REVEAL,
	EVENT_DRAW_REVEAL_LABEL,
	EVENT_DRAW_REVEAL_PAGE,
	EVENT_DRAW_REVEAL_PHASE,
	eventDrawRevealAuditChannelName,
	eventDrawRevealCanNext,
	eventDrawRevealCardKey,
	eventDrawRevealCards,
	eventDrawRevealChannelName,
	eventDrawRevealCountAfterStart,
	eventDrawRevealDelayMs,
	eventDrawRevealItemCount,
	eventDrawRevealNextPlayerCount,
	eventDrawRevealPageStatus,
	eventDrawRevealPhase,
	eventDrawRevealShouldTick,
	eventDrawRevealShareIsPrimary,
	eventDrawRevealShowControls,
	eventDrawRevealShowShare,
	eventDrawRevealSlotIsGoalkeeper,
	eventDrawRevealViewersFromPresence,
	eventDrawRevealViewingBadgeCount,
	eventDrawRevealViewingLabel,
	eventDrawRevealVisibleCards,
	eventDrawRevealVisiblePlayerCount,
	eventDrawUrl,
} from "./event-draw-reveal.ts";
import { EVENT_TEAM_COLOR, EVENT_TEAM_COLOR_NONE } from "./event-team-color.ts";
import { eventTeamsShareCards } from "./event-team-share.ts";

function check(actual: unknown, expected: unknown): void {
	if (actual !== expected) {
		throw new Error(`expected ${String(expected)}, got ${String(actual)}`);
	}
}

const ana = {
	id: 1,
	nickname: "Nena",
	display_name: "Ana",
	rating: 7.5,
	avatar_url: null,
};

const bruno = {
	id: 2,
	nickname: null,
	display_name: "Bruno",
	rating: 6,
	avatar_url: null,
};

const cards = eventDrawRevealCards(
	eventTeamsShareCards(
		[
			{
				key: "a",
				color: EVENT_TEAM_COLOR.red,
				slots: ["1", "2"],
				isActive: true,
			},
			{
				key: "b",
				color: EVENT_TEAM_COLOR_NONE,
				slots: ["", "99"],
				isActive: true,
			},
			{
				key: "c",
				color: EVENT_TEAM_COLOR.blue,
				slots: ["2"],
				isActive: true,
			},
		],
		[ana, bruno],
	),
);

check(cards.length, 2);
check(
	eventDrawRevealCardKey({ title: "A", color: "red", players: [] }),
	"A:red",
);
check(eventDrawRevealCardKey({ title: "B", color: null, players: [] }), "B:");
check(eventDrawRevealItemCount(cards), 5);
check(eventDrawRevealVisibleCards(cards, 0).length, 0);
check(eventDrawRevealVisibleCards(cards, 1)[0]?.players.length, 0);
check(eventDrawRevealVisibleCards(cards, 2)[0]?.players.length, 1);
check(eventDrawRevealVisibleCards(cards, 3)[0]?.players.length, 2);
check(eventDrawRevealVisibleCards(cards, 3).length, 1);
check(eventDrawRevealVisibleCards(cards, 4).length, 2);
check(eventDrawRevealVisibleCards(cards, 4)[1]?.players.length, 0);
check(eventDrawRevealVisibleCards(cards, 5)[1]?.players.length, 1);
check(eventDrawRevealVisiblePlayerCount(cards, 1), 0);
check(eventDrawRevealVisiblePlayerCount(cards, 3), 2);
check(eventDrawRevealNextPlayerCount(cards, 1), 2);
check(eventDrawRevealNextPlayerCount(cards, 3), 5);
check(eventDrawRevealNextPlayerCount(cards, 4), 5);
check(eventDrawRevealNextPlayerCount(cards, 5), 5);
check(eventDrawRevealCanNext(4, 5), true);
check(eventDrawRevealCanNext(5, 5), false);

check(
	eventDrawRevealShouldTick({
		phase: EVENT_DRAW_REVEAL_PHASE.playing,
		autoplay: true,
		reduceMotion: false,
	}),
	true,
);
check(
	eventDrawRevealShouldTick({
		phase: EVENT_DRAW_REVEAL_PHASE.playing,
		autoplay: false,
		reduceMotion: false,
	}),
	false,
);
check(
	eventDrawRevealShouldTick({
		phase: EVENT_DRAW_REVEAL_PHASE.playing,
		autoplay: true,
		reduceMotion: true,
	}),
	false,
);
check(
	eventDrawRevealShouldTick({
		phase: EVENT_DRAW_REVEAL_PHASE.poster,
		autoplay: true,
		reduceMotion: false,
	}),
	false,
);
check(
	eventDrawRevealShowControls(EVENT_DRAW_REVEAL_PHASE.playing, false),
	true,
);
check(
	eventDrawRevealShowControls(EVENT_DRAW_REVEAL_PHASE.playing, true),
	false,
);
check(eventDrawRevealShowControls(EVENT_DRAW_REVEAL_PHASE.done, false), false);
check(eventDrawRevealShowShare(EVENT_DRAW_REVEAL_PHASE.poster), true);
check(eventDrawRevealShowShare(EVENT_DRAW_REVEAL_PHASE.playing), false);
check(eventDrawRevealShowShare(EVENT_DRAW_REVEAL_PHASE.done), true);
check(eventDrawRevealShareIsPrimary(EVENT_DRAW_REVEAL_PHASE.poster), false);
check(eventDrawRevealShareIsPrimary(EVENT_DRAW_REVEAL_PHASE.playing), false);
check(eventDrawRevealShareIsPrimary(EVENT_DRAW_REVEAL_PHASE.done), true);

check(EVENT_DRAW_REVEAL_LABEL.pause, "Pausar sorteio");
check(EVENT_DRAW_REVEAL_LABEL.play, "Play sorteio");
check(EVENT_DRAW_REVEAL_LABEL.next, "Próximo jogador sorteado");

check(eventDrawRevealDelayMs(true), 0);
check(eventDrawRevealDelayMs(false), EVENT_DRAW_REVEAL.itemDelayMs);
check(eventDrawRevealCountAfterStart(5, true), 5);
check(eventDrawRevealCountAfterStart(5, false), 1);
check(eventDrawRevealCountAfterStart(0, false), 0);

check(eventDrawRevealPhase(0, 5), EVENT_DRAW_REVEAL_PHASE.poster);
check(eventDrawRevealPhase(2, 5), EVENT_DRAW_REVEAL_PHASE.playing);
check(eventDrawRevealPhase(5, 5), EVENT_DRAW_REVEAL_PHASE.done);

check(eventDrawRevealSlotIsGoalkeeper(1), true);
check(eventDrawRevealSlotIsGoalkeeper(2), false);

check(
	eventDrawUrl(
		"https://baba.test",
		3,
		9,
		"/championships/$championshipId/events/$eventId/draw",
	),
	"https://baba.test/championships/3/events/9/draw",
);

check(copyDrawLinkLabel(false), EVENT_ACTION.copyDrawLink);
check(copyDrawLinkLabel(true), EVENT_DRAW_REVEAL_LABEL.copied);

check(
	eventDrawRevealPageStatus({
		championshipPending: true,
		eventPending: false,
		championshipError: false,
		eventError: false,
		teamsReady: false,
	}),
	EVENT_DRAW_REVEAL_PAGE.loading,
);
check(
	eventDrawRevealPageStatus({
		championshipPending: false,
		eventPending: false,
		championshipError: true,
		eventError: false,
		teamsReady: true,
	}),
	EVENT_DRAW_REVEAL_PAGE.championshipError,
);
check(
	eventDrawRevealPageStatus({
		championshipPending: false,
		eventPending: false,
		championshipError: false,
		eventError: true,
		teamsReady: true,
	}),
	EVENT_DRAW_REVEAL_PAGE.eventError,
);
check(
	eventDrawRevealPageStatus({
		championshipPending: false,
		eventPending: false,
		championshipError: false,
		eventError: false,
		teamsReady: false,
	}),
	EVENT_DRAW_REVEAL_PAGE.empty,
);
check(
	eventDrawRevealPageStatus({
		championshipPending: false,
		eventPending: false,
		championshipError: false,
		eventError: false,
		teamsReady: true,
	}),
	EVENT_DRAW_REVEAL_PAGE.ready,
);

check(eventDrawRevealViewingLabel(0), EVENT_DRAW_REVEAL_LABEL.viewingEmpty);
check(eventDrawRevealViewingLabel(1), EVENT_DRAW_REVEAL_LABEL.viewingOne);
check(eventDrawRevealViewingLabel(3), "3 presenciando");
check(eventDrawRevealViewingBadgeCount(0), "0");
check(eventDrawRevealViewingBadgeCount(7), "7");
check(eventDrawRevealViewingBadgeCount(100), "99+");
check(eventDrawRevealChannelName(9), "event-draw:9");
check(eventDrawRevealAuditChannelName(9), "event-draw-audit:9");
check(
	eventDrawRevealViewersFromPresence({
		"1": [
			{ playerId: 1, displayName: "Ana", avatarUrl: null },
			{ playerId: 1, displayName: "Ana", avatarUrl: null },
		],
		"2": [{ playerId: 2, displayName: "Bruno", avatarUrl: "https://a" }],
		bad: [{ playerId: "x", displayName: "Nope" }],
	}).length,
	2,
);
check(
	eventDrawRevealViewersFromPresence({
		"2": [{ playerId: 2, displayName: "Bruno", avatarUrl: "https://a" }],
	})[0]?.displayName,
	"Bruno",
);

console.log("event-draw-reveal ok");
