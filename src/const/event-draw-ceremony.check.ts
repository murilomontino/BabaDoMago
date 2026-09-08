import {
	EVENT_DRAW_CEREMONY_INITIAL,
	EVENT_DRAW_VIDEO_STATUS,
	eventDrawCeremonyReducer,
	eventDrawCeremonyVideoFileName,
} from "./event-draw-ceremony.ts";
import { EVENT_POT_DRAW_STAGE } from "./event-team-pot-draw.ts";
import type { EventTeamShareCard } from "./event-team-share.ts";

function check(actual: unknown, expected: unknown): void {
	if (actual !== expected) {
		throw new Error(`expected ${String(expected)}, got ${String(actual)}`);
	}
}

const card: EventTeamShareCard = {
	title: "Time 1",
	color: null,
	players: [
		{
			id: 1,
			number: 1,
			name: "A",
			rating: 3,
			isGoalkeeperRating: false,
			avatarUrl: null,
		},
	],
};

const twoCards: EventTeamShareCard[] = [
	card,
	{ ...card, title: "Time 2" },
];

{
	const started = eventDrawCeremonyReducer(EVENT_DRAW_CEREMONY_INITIAL, {
		type: "BEGIN_TEAMS_CEREMONY",
		cards: twoCards,
		reduceMotion: false,
	});
	check(started.frozenCards?.length, 2);
	check(started.autoplay, true);
	check(started.visibleCount > 0, true);

	const ticked = eventDrawCeremonyReducer(started, {
		type: "TICK_TEAMS",
		total: 4,
	});
	check(ticked.visibleCount, started.visibleCount + 1);

	const replayed = eventDrawCeremonyReducer(ticked, { type: "REPLAY_TEAMS" });
	check(replayed.visibleCount, 0);
}

{
	const pots = eventDrawCeremonyReducer(EVENT_DRAW_CEREMONY_INITIAL, {
		type: "BEGIN_POTS_CEREMONY",
		cards: twoCards,
		potCards: twoCards,
		reduceMotion: false,
	});
	check(pots.ceremonyStage, EVENT_POT_DRAW_STAGE.pots);
	check(pots.potVisibleCount > 0, true);

	const advanced = eventDrawCeremonyReducer(pots, {
		type: "TICK_POTS",
		potCardsLength: 2,
		teamTotal: 4,
		reduceMotion: false,
	});
	check(
		advanced.potVisibleCount >= pots.potVisibleCount ||
			advanced.ceremonyStage === EVENT_POT_DRAW_STAGE.teams,
		true,
	);

	const replayed = eventDrawCeremonyReducer(advanced, { type: "REPLAY_POTS" });
	check(replayed.ceremonyStage, EVENT_POT_DRAW_STAGE.pots);
	check(replayed.potVisibleCount, 0);
	check(replayed.visibleCount, 0);
}

{
	const drawing = eventDrawCeremonyReducer(EVENT_DRAW_CEREMONY_INITIAL, {
		type: "DRAW_START",
	});
	check(drawing.isDrawing, true);

	const failed = eventDrawCeremonyReducer(drawing, {
		type: "DRAW_FAIL",
		error: "x",
	});
	check(failed.isDrawing, false);
	check(failed.drawError, "x");

	const video = eventDrawCeremonyReducer(EVENT_DRAW_CEREMONY_INITIAL, {
		type: "VIDEO_START",
	});
	check(video.videoStatus, EVENT_DRAW_VIDEO_STATUS.generating);

	const ready = eventDrawCeremonyReducer(video, {
		type: "VIDEO_READY",
		blob: new Blob(),
		hasAudio: false,
	});
	check(ready.videoStatus, EVENT_DRAW_VIDEO_STATUS.ready);
	check(ready.videoHasAudio, false);

	const dismissed = eventDrawCeremonyReducer(ready, { type: "VIDEO_DISMISS" });
	check(dismissed.videoStatus, EVENT_DRAW_VIDEO_STATUS.idle);
}

{
	check(eventDrawCeremonyVideoFileName("Baba Do Mago", 12), "sorteio-baba-do-mago-12.mp4");
}

console.log("event-draw-ceremony.check.ts: ok");
