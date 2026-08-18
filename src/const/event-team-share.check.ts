import { EVENT_TEAM_COLOR, EVENT_TEAM_COLOR_NONE } from "./event-team-color.ts";
import {
	EVENT_TEAM_SHARE,
	eventTeamShareCardHeight,
	eventTeamShareFileName,
	eventTeamShareImageHeight,
	eventTeamsShareCards,
	eventTeamsShareText,
} from "./event-team-share.ts";

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
	avatar_url: "https://example.com/ana.png",
};

const bruno = {
	id: 2,
	nickname: null,
	display_name: "Bruno",
	rating: 6,
	avatar_url: null,
};

const cards = eventTeamsShareCards(
	[
		{
			key: "a",
			color: EVENT_TEAM_COLOR.red,
			slots: ["1", "", "2"],
			isActive: true,
		},
		{
			key: "b",
			color: EVENT_TEAM_COLOR_NONE,
			slots: ["", "99"],
			isActive: true,
		},
	],
	[ana, bruno],
);

check(cards.length, 2);
check(cards[0]?.title, "Vermelho");
check(cards[0]?.color, EVENT_TEAM_COLOR.red);
check(cards[0]?.players.length, 2);
check(cards[0]?.players[0]?.number, 1);
check(cards[0]?.players[0]?.name, "Nena");
check(cards[0]?.players[0]?.rating, 7.5);
check(cards[0]?.players[0]?.avatarUrl, ana.avatar_url);
check(cards[0]?.players[1]?.number, 3);
check(cards[0]?.players[1]?.name, "Bruno");
check(cards[0]?.players[1]?.rating, 6);
check(cards[0]?.players[1]?.avatarUrl, null);
check(cards[1]?.title, "Time 2");
check(cards[1]?.players.length, 0);

check(
	eventTeamShareCardHeight(0),
	EVENT_TEAM_SHARE.cardPadding * 2 + EVENT_TEAM_SHARE.headerHeight,
);
check(
	eventTeamShareCardHeight(2),
	EVENT_TEAM_SHARE.cardPadding * 2 +
		EVENT_TEAM_SHARE.headerHeight +
		EVENT_TEAM_SHARE.rowHeight * 2,
);
check(eventTeamShareImageHeight([]), EVENT_TEAM_SHARE.padding * 2);
check(
	eventTeamShareImageHeight([1, 5]),
	EVENT_TEAM_SHARE.padding * 2 + eventTeamShareCardHeight(5),
);
check(
	eventTeamShareImageHeight([1, 2, 3]),
	EVENT_TEAM_SHARE.padding * 2 +
		eventTeamShareCardHeight(2) +
		EVENT_TEAM_SHARE.gap +
		eventTeamShareCardHeight(3),
);

check(
	eventTeamShareFileName({
		championshipName: "Baba do Mago",
		startsAt: "2026-08-14T22:00:00.000Z",
		generatedAt: "2026-08-14T13:00:00.000Z",
	}),
	"times-baba-do-mago-14-08-2026-14-08-2026.png",
);
check(
	eventTeamShareFileName({
		championshipName: "",
		startsAt: "",
		generatedAt: "nope",
	}),
	EVENT_TEAM_SHARE.fileName,
);
check(
	eventTeamShareFileName({
		championshipName: "",
		startsAt: "nope",
		generatedAt: "nope",
	}),
	EVENT_TEAM_SHARE.fileName,
);

check(
	eventTeamsShareText(cards, "2026-08-14T22:00:00.000Z"),
	"Times 14/08/2026\n\nVermelho\n1 - Nena\n3 - Bruno\n\nTime 2",
);
check(
	eventTeamsShareText(cards, ""),
	"Times\n\nVermelho\n1 - Nena\n3 - Bruno\n\nTime 2",
);
