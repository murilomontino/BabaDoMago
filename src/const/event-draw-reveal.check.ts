import { EVENT_ACTION } from "./championship-event.ts";
import {
	copyDrawLinkLabel,
	EVENT_DRAW_REVEAL,
	EVENT_DRAW_REVEAL_LABEL,
	EVENT_DRAW_REVEAL_PAGE,
	EVENT_DRAW_REVEAL_PHASE,
	eventDrawRevealAdvanceEnabled,
	eventDrawRevealAuditChannelName,
	eventDrawRevealCanNext,
	eventDrawRevealCardKey,
	eventDrawRevealCards,
	eventDrawRevealChannelName,
	eventDrawRevealCountAfterStart,
	eventDrawRevealDelayMs,
	eventDrawRevealGridClass,
	eventDrawRevealHeading,
	eventDrawRevealItemCount,
	eventDrawRevealNextPlayerCount,
	eventDrawRevealPageSettled,
	eventDrawRevealPageStatus,
	eventDrawRevealPhase,
	eventDrawRevealRoundRobinSlots,
	eventDrawRevealShareIsPrimary,
	eventDrawRevealShouldAutoStart,
	eventDrawRevealShouldTick,
	eventDrawRevealShowControls,
	eventDrawRevealShowShare,
	eventDrawRevealShowsPosition,
	eventDrawRevealSlotIsGoalkeeper,
	eventDrawRevealViewersFromPresence,
	eventDrawRevealViewingBadgeCount,
	eventDrawRevealViewingLabel,
	eventDrawRevealVisibleCards,
	eventDrawRevealVisiblePlayerCount,
	eventDrawRevealWaitingHint,
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

const caio = {
	id: 3,
	nickname: "Caio",
	display_name: "Caio",
	rating: 5,
	avatar_url: null,
};

const dana = {
	id: 4,
	nickname: "Dana",
	display_name: "Dana",
	rating: 4,
	avatar_url: null,
};

const eva = {
	id: 5,
	nickname: "Eva",
	display_name: "Eva",
	rating: 8,
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

const roundRobinCards = eventDrawRevealCards(
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
				color: EVENT_TEAM_COLOR.green,
				slots: ["3"],
				isActive: true,
			},
			{
				key: "c",
				color: EVENT_TEAM_COLOR.blue,
				slots: ["4", "5"],
				isActive: true,
			},
		],
		[ana, bruno, caio, dana, eva],
	),
);

check(cards.length, 2);
check(roundRobinCards.length, 3);
check(roundRobinCards[0]?.players.length, 2);
check(roundRobinCards[1]?.players.length, 1);
check(roundRobinCards[2]?.players.length, 2);
check(
	eventDrawRevealCardKey({ title: "A", color: "red", players: [] }),
	"A:red",
);
check(eventDrawRevealCardKey({ title: "B", color: null, players: [] }), "B:");
check(eventDrawRevealItemCount(roundRobinCards), 5);
check(eventDrawRevealRoundRobinSlots(roundRobinCards).length, 5);
check(eventDrawRevealRoundRobinSlots(roundRobinCards)[0]?.teamIndex, 0);
check(eventDrawRevealRoundRobinSlots(roundRobinCards)[0]?.playerIndex, 0);
check(eventDrawRevealRoundRobinSlots(roundRobinCards)[1]?.teamIndex, 1);
check(eventDrawRevealRoundRobinSlots(roundRobinCards)[1]?.playerIndex, 0);
check(eventDrawRevealRoundRobinSlots(roundRobinCards)[2]?.teamIndex, 2);
check(eventDrawRevealRoundRobinSlots(roundRobinCards)[2]?.playerIndex, 0);
check(eventDrawRevealRoundRobinSlots(roundRobinCards)[3]?.teamIndex, 0);
check(eventDrawRevealRoundRobinSlots(roundRobinCards)[3]?.playerIndex, 1);
check(eventDrawRevealRoundRobinSlots(roundRobinCards)[4]?.teamIndex, 2);
check(eventDrawRevealRoundRobinSlots(roundRobinCards)[4]?.playerIndex, 1);
check(eventDrawRevealVisibleCards(roundRobinCards, 0).length, 0);
check(eventDrawRevealVisibleCards(roundRobinCards, 1).length, 3);
check(eventDrawRevealVisibleCards(roundRobinCards, 1)[0]?.players.length, 1);
check(eventDrawRevealVisibleCards(roundRobinCards, 1)[1]?.players.length, 0);
check(eventDrawRevealVisibleCards(roundRobinCards, 1)[2]?.players.length, 0);
check(eventDrawRevealVisibleCards(roundRobinCards, 3)[0]?.players.length, 1);
check(eventDrawRevealVisibleCards(roundRobinCards, 3)[1]?.players.length, 1);
check(eventDrawRevealVisibleCards(roundRobinCards, 3)[2]?.players.length, 1);
check(eventDrawRevealVisibleCards(roundRobinCards, 4)[0]?.players.length, 2);
check(eventDrawRevealVisibleCards(roundRobinCards, 4)[1]?.players.length, 1);
check(eventDrawRevealVisibleCards(roundRobinCards, 4)[2]?.players.length, 1);
check(eventDrawRevealVisibleCards(roundRobinCards, 5)[2]?.players.length, 2);
check(eventDrawRevealVisiblePlayerCount(roundRobinCards, 1), 1);
check(eventDrawRevealVisiblePlayerCount(roundRobinCards, 3), 3);
check(eventDrawRevealNextPlayerCount(roundRobinCards, 1), 2);
check(eventDrawRevealNextPlayerCount(roundRobinCards, 3), 4);
check(eventDrawRevealNextPlayerCount(roundRobinCards, 4), 5);
check(eventDrawRevealNextPlayerCount(roundRobinCards, 5), 5);
check(eventDrawRevealCanNext(4, 5), true);
check(eventDrawRevealCanNext(5, 5), false);
check(eventDrawRevealAdvanceEnabled(undefined, 4, 5), true);
check(eventDrawRevealAdvanceEnabled(undefined, 5, 5), false);
check(eventDrawRevealAdvanceEnabled(true, 5, 5), true);
check(eventDrawRevealAdvanceEnabled(false, 4, 5), false);
check(eventDrawRevealShowsPosition(undefined), true);
check(eventDrawRevealShowsPosition(true), true);
check(eventDrawRevealShowsPosition(false), false);
check(eventDrawRevealGridClass(1), "grid-cols-1");
check(eventDrawRevealGridClass(4), "grid-cols-2");

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

check(EVENT_DRAW_REVEAL_LABEL.shareShort, "Compartilhar");
check(EVENT_DRAW_REVEAL_LABEL.replay, "Ver de novo");
check(EVENT_DRAW_REVEAL_LABEL.pause, "Pausar sorteio");
check(EVENT_DRAW_REVEAL_LABEL.play, "Play sorteio");
check(EVENT_DRAW_REVEAL_LABEL.next, "Próximo jogador sorteado");
check(EVENT_ACTION.openDraw, "Abrir sorteio");
check(EVENT_ACTION.openPotDraw, "Sorteio por potes");
check(EVENT_DRAW_REVEAL_LABEL.potTitle, "Sorteio por potes");
check(eventDrawRevealHeading(undefined), EVENT_DRAW_REVEAL_LABEL.title);
check(
	eventDrawRevealHeading(EVENT_DRAW_REVEAL_LABEL.potTitle),
	EVENT_DRAW_REVEAL_LABEL.potTitle,
);
check(eventDrawRevealWaitingHint(true), EVENT_DRAW_REVEAL_LABEL.waitingHost);
check(eventDrawRevealWaitingHint(false), EVENT_DRAW_REVEAL_LABEL.waitingGuest);
check(eventDrawRevealPageSettled(EVENT_DRAW_REVEAL_PAGE.loading), false);
check(eventDrawRevealPageSettled(EVENT_DRAW_REVEAL_PAGE.empty), true);
check(eventDrawRevealPageSettled(EVENT_DRAW_REVEAL_PAGE.ready), true);
check(
	eventDrawRevealShouldAutoStart({
		previousReady: null,
		ready: true,
		visibleCount: 0,
		settled: true,
	}),
	false,
);
check(
	eventDrawRevealShouldAutoStart({
		previousReady: false,
		ready: true,
		visibleCount: 0,
		settled: false,
	}),
	false,
);
check(
	eventDrawRevealShouldAutoStart({
		previousReady: false,
		ready: true,
		visibleCount: 0,
		settled: true,
	}),
	true,
);
check(
	eventDrawRevealShouldAutoStart({
		previousReady: true,
		ready: true,
		visibleCount: 0,
		settled: true,
	}),
	false,
);
check(
	eventDrawRevealShouldAutoStart({
		previousReady: false,
		ready: true,
		visibleCount: 1,
		settled: true,
	}),
	false,
);

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
check(
	eventDrawUrl(
		"https://baba.test",
		3,
		9,
		"/championships/$championshipId/events/$eventId/draw-pots",
	),
	"https://baba.test/championships/3/events/9/draw-pots",
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
