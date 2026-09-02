import {
	drawBalancedEventTeams,
	EVENT_TEAM_DRAW_ALGORITHM_VERSION,
	type EventTeamDraft,
} from "../const/championship-event.ts";
import {
	drawPotEventTeams,
	EVENT_TEAM_POT_DRAW_ALGORITHM_VERSION,
} from "../const/event-team-pot-draw.ts";
import { mulberry32 } from "./prng.ts";

export type EventDrawAuditPayload = {
	seed: number;
	algorithmVersion: number;
	inputSnapshot: {
		players: readonly { id: number; rating: number }[];
		playersPerTeam: number;
		volunteerIds: readonly number[];
	};
	outputSnapshot?: {
		teams: readonly {
			playerIds: readonly number[];
			goalkeeperId: number;
		}[];
	};
};

export type ReplayedEventDraw = {
	teams: EventTeamDraft[];
	matchesSavedOutput: boolean;
};

function replayDrawTeams(audit: EventDrawAuditPayload): EventTeamDraft[] {
	const random = mulberry32(audit.seed);
	switch (audit.algorithmVersion) {
		case EVENT_TEAM_DRAW_ALGORITHM_VERSION:
			return drawBalancedEventTeams(
				audit.inputSnapshot.players,
				audit.inputSnapshot.playersPerTeam,
				random,
				audit.inputSnapshot.volunteerIds,
			);
		case EVENT_TEAM_POT_DRAW_ALGORITHM_VERSION:
			return drawPotEventTeams(
				audit.inputSnapshot.players,
				audit.inputSnapshot.playersPerTeam,
				random,
				audit.inputSnapshot.volunteerIds,
			);
		default:
			throw new Error(
				`Versao de algoritmo nao suportada: ${audit.algorithmVersion}`,
			);
	}
}

function replayOutputMatches(
	teams: readonly EventTeamDraft[],
	saved: readonly {
		playerIds: readonly number[];
		goalkeeperId: number;
	}[],
): boolean {
	if (saved.length !== teams.length) {
		return false;
	}

	return teams.every((generatedTeam, index) => {
		const savedTeam = saved[index];
		if (!savedTeam) {
			return false;
		}

		if (generatedTeam.goalkeeperId !== savedTeam.goalkeeperId) {
			return false;
		}

		return generatedTeam.playerIds.join(",") === savedTeam.playerIds.join(",");
	});
}

/**
 * Re-executa o sorteio de forma deterministica a partir dos dados de auditoria.
 * Se outputSnapshot for fornecido, valida se o resultado re-executado e IDENTICO ao salvo.
 */
export function replayEventDraw(
	audit: EventDrawAuditPayload,
): ReplayedEventDraw {
	const teams = replayDrawTeams(audit);
	if (!audit.outputSnapshot?.teams) {
		return { teams, matchesSavedOutput: true };
	}

	return {
		teams,
		matchesSavedOutput: replayOutputMatches(teams, audit.outputSnapshot.teams),
	};
}
