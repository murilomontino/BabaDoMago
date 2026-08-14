import { Goal, Handshake } from "lucide-react";
import { EVENT_GOAL_LABEL } from "@/const/championship-event-match";

type GoalTimelineEventProps = {
	scorerName: string;
	assistName: string | null;
	isOwnGoal: boolean;
	mirror: boolean;
};

export function GoalTimelineEvent({
	scorerName,
	assistName,
	isOwnGoal,
	mirror,
}: GoalTimelineEventProps) {
	return (
		<span
			className={`inline-flex min-w-0 max-w-full items-center gap-1 text-xs text-fg-muted ${
				mirror ? "flex-row-reverse" : ""
			}`}
		>
			{isOwnGoal && (
				<Goal
					className="size-3 shrink-0 text-danger-fg"
					aria-label={EVENT_GOAL_LABEL.ownGoal}
				/>
			)}
			{!isOwnGoal && (
				<Goal className="size-3 shrink-0" aria-label={EVENT_GOAL_LABEL.goal} />
			)}
			<span className="truncate">{scorerName}</span>
			{assistName && (
				<>
					<Handshake
						className="size-3 shrink-0"
						aria-label={EVENT_GOAL_LABEL.assist}
					/>
					<span className="truncate">{assistName}</span>
				</>
			)}
		</span>
	);
}
