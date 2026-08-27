import type { EventTeamDraft } from "@/const/championship-event";

type EventTeamDrawResponse = {
	teams: EventTeamDraft[] | null;
	error: string | null;
};

export function runEventTeamDraw(input: {
	players: readonly { id: number; rating: number }[];
	playersPerTeam: number;
	volunteerIds: readonly number[];
}): { worker: Worker; done: Promise<EventTeamDraft[]> } {
	const worker = new Worker(
		new URL("../workers/event-team-draw.worker.ts", import.meta.url),
		{ type: "module" },
	);
	const done = new Promise<EventTeamDraft[]>((resolve, reject) => {
		worker.onmessage = ({ data }: MessageEvent<EventTeamDrawResponse>) => {
			if (!data.teams || data.error) {
				reject(new Error(data.error ?? "team draw failed"));
				return;
			}

			resolve(data.teams);
		};
		worker.onerror = () => {
			reject(new Error("team draw failed"));
		};
		worker.postMessage({
			players: [...input.players],
			playersPerTeam: input.playersPerTeam,
			volunteerIds: [...input.volunteerIds],
		});
	});

	return { worker, done };
}
