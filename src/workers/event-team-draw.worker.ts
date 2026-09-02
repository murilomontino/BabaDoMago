import {
	drawBalancedEventTeams,
	EVENT_TEAM_DRAW_ALGORITHM_VERSION,
	type EventTeamDraft,
} from "../const/championship-event.ts";
import { caughtErrorMessage } from "../lib/error-message.ts";
import { createDrawSeed, mulberry32 } from "../lib/prng.ts";

type EventTeamDrawRequest = {
	players: { id: number; rating: number }[];
	playersPerTeam: number;
	volunteerIds?: number[];
	seed?: number;
};

type EventTeamDrawResponse = {
	teams: EventTeamDraft[] | null;
	seed: number | null;
	algorithmVersion: number | null;
	error: string | null;
};

self.onmessage = ({ data }: MessageEvent<EventTeamDrawRequest>) => {
	try {
		const seed =
			typeof data.seed === "number" ? data.seed >>> 0 : createDrawSeed();
		const random = mulberry32(seed);
		self.postMessage({
			teams: drawBalancedEventTeams(
				data.players,
				data.playersPerTeam,
				random,
				data.volunteerIds ?? [],
			),
			seed,
			algorithmVersion: EVENT_TEAM_DRAW_ALGORITHM_VERSION,
			error: null,
		} satisfies EventTeamDrawResponse);
	} catch (error) {
		self.postMessage({
			teams: null,
			seed: null,
			algorithmVersion: null,
			error: caughtErrorMessage(error, "team draw failed"),
		} satisfies EventTeamDrawResponse);
	}
};
