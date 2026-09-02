import {
	drawBalancedEventTeams,
	EVENT_TEAM_DRAW_ALGORITHM_VERSION,
	type EventTeamDraft,
} from "../const/championship-event.ts";
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

/**
 * Re-executa o sorteio de forma deterministica a partir dos dados de auditoria.
 * Se outputSnapshot for fornecido, valida se o resultado re-executado e IDENTICO ao salvo.
 */
export function replayEventDraw(
	audit: EventDrawAuditPayload,
): ReplayedEventDraw {
	if (audit.algorithmVersion !== EVENT_TEAM_DRAW_ALGORITHM_VERSION) {
		throw new Error(
			`Versao de algoritmo nao suportada: ${audit.algorithmVersion}`,
		);
	}

	const random = mulberry32(audit.seed);
	const teams = drawBalancedEventTeams(
		audit.inputSnapshot.players,
		audit.inputSnapshot.playersPerTeam,
		random,
		audit.inputSnapshot.volunteerIds,
	);

	let matchesSavedOutput = true;
	if (audit.outputSnapshot?.teams) {
		const saved = audit.outputSnapshot.teams;
		if (saved.length !== teams.length) {
			matchesSavedOutput = false;
		} else {
			for (let i = 0; i < teams.length; i++) {
				const generatedTeam = teams[i];
				const savedTeam = saved[i];
				if (
					!generatedTeam ||
					!savedTeam ||
					generatedTeam.goalkeeperId !== savedTeam.goalkeeperId ||
					generatedTeam.playerIds.join(",") !== savedTeam.playerIds.join(",")
				) {
					matchesSavedOutput = false;
					break;
				}
			}
		}
	}

	return { teams, matchesSavedOutput };
}
