import { useState } from "react";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { ChampionshipEventGoalModal } from "@/components/championship-event-goal-modal";
import { EventTeamPlayerAvatar } from "@/components/event-team-player";
import {
	EVENT_GOAL_KIND,
	EVENT_GOAL_LABEL,
	type MatchGoalEditPayload,
	matchGoalEditAssistCandidates,
	matchGoalEditPayload,
	matchGoalEditScorerCandidates,
} from "@/const/championship-event-match";
import { resolveRosterPlayer } from "@/const/championship-event-roster";
import { playerVisibleName } from "@/const/player-name";
import { BUTTON_VARIANT, ERROR_CLASS, MODAL_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";
import type {
	ChampionshipEventGoal,
	ChampionshipEventMatchPlayer,
} from "@/types/championship-event";

type ChampionshipEventEditGoalModalProps = {
	goal: ChampionshipEventGoal;
	matchPlayers: readonly ChampionshipEventMatchPlayer[];
	rosterById: ReadonlyMap<number, ChampionshipPlayer>;
	isPending?: boolean;
	errorMessage?: string | null;
	onCancel: () => void;
	onSave: (payload: MatchGoalEditPayload) => Promise<void>;
};

export function ChampionshipEventEditGoalModal({
	goal,
	matchPlayers,
	rosterById,
	isPending = false,
	errorMessage = null,
	onCancel,
	onSave,
}: ChampionshipEventEditGoalModalProps) {
	const [scorerPlayerId, setScorerPlayerId] = useState<number | null>(null);

	const scorerCandidates = matchGoalEditScorerCandidates(goal, matchPlayers);

	if (scorerPlayerId !== null && !goal.is_own_goal) {
		const scorerRow = matchPlayers.find(
			(player) => player.player_id === scorerPlayerId,
		);
		const scorer = resolveRosterPlayer(
			scorerPlayerId,
			scorerRow?.display_name ?? "",
			rosterById,
		);
		const assistCandidates = matchGoalEditAssistCandidates(
			scorerPlayerId,
			matchPlayers,
		).map((row) =>
			resolveRosterPlayer(row.player_id, row.display_name, rosterById),
		);

		return (
			<ChampionshipEventGoalModal
				scorerName={playerVisibleName(scorer)}
				candidates={assistCandidates}
				isPending={isPending}
				errorMessage={errorMessage}
				onCancel={onCancel}
				onConfirm={async (values) => {
					await onSave(
						matchGoalEditPayload(goal.id, {
							scorerPlayerId,
							kind: values.kind,
							assistPlayerId: values.assistPlayerId,
						}),
					);
				}}
			/>
		);
	}

	return (
		<AppDialog onClose={onCancel}>
			<div className={MODAL_CLASS}>
				<h2 className="mb-1 text-lg font-semibold tracking-tight text-fg">
					{EVENT_GOAL_LABEL.whoScored}
				</h2>
				<p className="mb-3 text-sm text-fg-muted">{EVENT_GOAL_LABEL.editHint}</p>
				<ul className="space-y-1">
					{scorerCandidates.map((row) => {
						const player = resolveRosterPlayer(
							row.player_id,
							row.display_name,
							rosterById,
						);
						return (
							<li key={row.player_id}>
								<Button
									variant={BUTTON_VARIANT.secondary}
									className="w-full justify-start"
									disabled={isPending}
									onClick={() => {
										if (goal.is_own_goal) {
											void onSave(
												matchGoalEditPayload(goal.id, {
													scorerPlayerId: row.player_id,
													kind: EVENT_GOAL_KIND.ownGoal,
													assistPlayerId: null,
												}),
											);
											return;
										}

										setScorerPlayerId(row.player_id);
									}}
								>
									<EventTeamPlayerAvatar player={player} />
									{playerVisibleName(player)}
								</Button>
							</li>
						);
					})}
				</ul>
				{errorMessage && scorerPlayerId === null && (
					<p className={`mt-2 ${ERROR_CLASS}`}>{errorMessage}</p>
				)}
				<div className="mt-4 flex justify-end">
					<Button
						variant={BUTTON_VARIANT.secondary}
						onClick={onCancel}
						disabled={isPending}
					>
						Cancelar
					</Button>
				</div>
			</div>
		</AppDialog>
	);
}
