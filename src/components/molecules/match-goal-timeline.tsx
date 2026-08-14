import { X } from "lucide-react";
import { GoalTimelineEvent } from "@/components/molecules/goal-timeline-event";
import { EVENT_ACTION } from "@/const/championship-event";
import {
	matchGoalForTeamA,
	matchGoalTimeline,
} from "@/const/championship-event-match";
import type { ChampionshipEventGoal } from "@/types/championship-event";

export const MATCH_GOAL_TIMELINE_GRID_CLASS =
	"grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 gap-y-0.5";

type MatchGoalTimelineProps = {
	goals: readonly ChampionshipEventGoal[];
	teamAPlayerIds: ReadonlySet<number>;
	playerName: (playerId: number) => string;
	undoDisabled?: boolean;
	onUndoGoal?: (goalId: number) => void;
};

function UndoGoalButton({
	disabled,
	onUndo,
}: {
	disabled: boolean;
	onUndo: () => void;
}) {
	return (
		<button
			type="button"
			aria-label={EVENT_ACTION.undoGoal}
			disabled={disabled}
			className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-fg-muted hover:bg-danger-soft hover:text-danger-fg disabled:opacity-50"
			onClick={onUndo}
		>
			<X className="size-3.5" />
		</button>
	);
}

export function MatchGoalTimeline({
	goals,
	teamAPlayerIds,
	playerName,
	undoDisabled = false,
	onUndoGoal,
}: MatchGoalTimelineProps) {
	const timeline = matchGoalTimeline(goals);
	if (timeline.length === 0) {
		return null;
	}

	return (
		<>
			{timeline.map((goal) => {
				const forTeamA = matchGoalForTeamA(goal, teamAPlayerIds);
				const assistName =
					goal.assist_player_id === null
						? null
						: playerName(goal.assist_player_id);
				const event = (
					<GoalTimelineEvent
						scorerName={playerName(goal.scorer_player_id)}
						assistName={assistName}
						isOwnGoal={goal.is_own_goal}
						mirror={forTeamA}
					/>
				);
				const undo = onUndoGoal && (
					<UndoGoalButton
						disabled={undoDisabled}
						onUndo={() => {
							onUndoGoal(goal.id);
						}}
					/>
				);

				return (
					<div key={goal.id} className="contents">
						<div className="flex min-w-0 items-center justify-end gap-0.5">
							{forTeamA && undo}
							{forTeamA && event}
						</div>
						<span />
						<div className="flex min-w-0 items-center justify-start gap-0.5">
							{!forTeamA && event}
							{!forTeamA && undo}
						</div>
					</div>
				);
			})}
		</>
	);
}
