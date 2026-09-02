import type { EventTeamDraft } from "../const/championship-event.ts";
import {
	drawPotEventTeams,
	EVENT_TEAM_POT_DRAW_ALGORITHM_VERSION,
} from "../const/event-team-pot-draw.ts";
import { caughtErrorMessage } from "../lib/error-message.ts";
import { createDrawSeed, mulberry32 } from "../lib/prng.ts";

type EventTeamPotDrawRequest = {
	players: { id: number; rating: number }[];
	playersPerTeam: number;
	volunteerIds?: number[];
	seed?: number;
};

type EventTeamPotDrawResponse = {
	teams: EventTeamDraft[] | null;
	seed: number | null;
	algorithmVersion: number | null;
	error: string | null;
};

self.onmessage = ({ data }: MessageEvent<EventTeamPotDrawRequest>) => {
	try {
		const seed =
			typeof data.seed === "number" ? data.seed >>> 0 : createDrawSeed();
		const random = mulberry32(seed);
		self.postMessage({
			teams: drawPotEventTeams(
				data.players,
				data.playersPerTeam,
				random,
				data.volunteerIds ?? [],
			),
			seed,
			algorithmVersion: EVENT_TEAM_POT_DRAW_ALGORITHM_VERSION,
			error: null,
		} satisfies EventTeamPotDrawResponse);
	} catch (error) {
		self.postMessage({
			teams: null,
			seed: null,
			algorithmVersion: null,
			error: caughtErrorMessage(error, "team draw failed"),
		} satisfies EventTeamPotDrawResponse);
	}
};
