import type { EventTeamDraft } from "@/const/championship-event";

type EventTeamPotDrawResponse = {
	teams: EventTeamDraft[] | null;
	seed: number | null;
	algorithmVersion: number | null;
	error: string | null;
};

export type EventTeamPotDrawResult = {
	teams: EventTeamDraft[];
	seed: number;
	algorithmVersion: number;
};

export function runEventTeamPotDraw(input: {
	players: readonly { id: number; rating: number }[];
	playersPerTeam: number;
	volunteerIds: readonly number[];
	seed?: number;
}): { worker: Worker; done: Promise<EventTeamPotDrawResult> } {
	const worker = new Worker(
		new URL("../workers/event-team-pot-draw.worker.ts", import.meta.url),
		{ type: "module" },
	);
	const done = new Promise<EventTeamPotDrawResult>((resolve, reject) => {
		worker.onmessage = ({ data }: MessageEvent<EventTeamPotDrawResponse>) => {
			if (
				!data.teams ||
				data.seed === null ||
				data.algorithmVersion === null ||
				data.error
			) {
				reject(new Error(data.error ?? "team draw failed"));
				return;
			}

			resolve({
				teams: data.teams,
				seed: data.seed,
				algorithmVersion: data.algorithmVersion,
			});
		};
		worker.onerror = () => {
			reject(new Error("team draw failed"));
		};
		worker.postMessage({
			players: [...input.players],
			playersPerTeam: input.playersPerTeam,
			volunteerIds: [...input.volunteerIds],
			seed: input.seed,
		});
	});

	return { worker, done };
}
