import { GoalTimelineEvent } from "@/components/molecules/goal-timeline-event";
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
};

export function MatchGoalTimeline({
	goals,
	teamAPlayerIds,
	playerName,
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

				return (
					<div key={goal.id} className="contents">
						<div className="flex min-w-0 justify-end">{forTeamA && event}</div>
						<span />
						<div className="flex min-w-0 justify-start">
							{!forTeamA && event}
						</div>
					</div>
				);
			})}
		</>
	);
}
