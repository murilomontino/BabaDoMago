import { GoalIcon } from "@/components/goal-icon";

type OwnGoalIconProps = {
	className?: string;
	"aria-label"?: string;
};

export const OWN_GOAL_LABEL_POSITION = {
	start: "start",
	end: "end",
} as const;

export type OwnGoalLabelPosition =
	(typeof OWN_GOAL_LABEL_POSITION)[keyof typeof OWN_GOAL_LABEL_POSITION];

export function OwnGoalIcon({
	className,
	"aria-label": ariaLabel,
}: OwnGoalIconProps) {
	return (
		<GoalIcon
			className={`text-danger-fg ${className ?? ""}`}
			aria-label={ariaLabel}
		/>
	);
}
