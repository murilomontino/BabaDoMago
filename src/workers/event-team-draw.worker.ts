import {
	drawBalancedEventTeams,
	type EventTeamDraft,
} from "../const/championship-event.ts";

type EventTeamDrawRequest = {
	players: { id: number; rating: number }[];
	playersPerTeam: number;
	volunteerIds?: number[];
};

type EventTeamDrawResponse = {
	teams: EventTeamDraft[] | null;
	error: string | null;
};

self.onmessage = ({ data }: MessageEvent<EventTeamDrawRequest>) => {
	try {
		self.postMessage({
			teams: drawBalancedEventTeams(
				data.players,
				data.playersPerTeam,
				Math.random,
				data.volunteerIds ?? [],
			),
			error: null,
		} satisfies EventTeamDrawResponse);
	} catch (error) {
		self.postMessage({
			teams: null,
			error: error instanceof Error ? error.message : "team draw failed",
		} satisfies EventTeamDrawResponse);
	}
};
