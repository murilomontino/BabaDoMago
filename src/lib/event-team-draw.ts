import type { EventTeamDraft } from "@/const/championship-event";

type EventTeamDrawResponse = {
	teams: EventTeamDraft[] | null;
	seed: number | null;
	algorithmVersion: number | null;
	error: string | null;
};

export type EventTeamDrawResult = {
	teams: EventTeamDraft[];
	seed: number;
	algorithmVersion: number;
};

export function runEventTeamDraw(input: {
	players: readonly { id: number; rating: number }[];
	playersPerTeam: number;
	volunteerIds: readonly number[];
	seed?: number;
}): { worker: Worker; done: Promise<EventTeamDrawResult> } {
	const worker = new Worker(
		new URL("../workers/event-team-draw.worker.ts", import.meta.url),
		{ type: "module" },
	);
	const done = new Promise<EventTeamDrawResult>((resolve, reject) => {
		worker.onmessage = ({ data }: MessageEvent<EventTeamDrawResponse>) => {
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
