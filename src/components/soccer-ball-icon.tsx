import { ariaHiddenWhenUnlabelled } from "@/const/ui";

type SoccerBallIconProps = {
	className?: string;
	"aria-label"?: string;
};

export const OWN_GOAL_LABEL_POSITION = {
	start: "start",
	end: "end",
} as const;

export type OwnGoalLabelPosition =
	(typeof OWN_GOAL_LABEL_POSITION)[keyof typeof OWN_GOAL_LABEL_POSITION];

function SoccerBallGlyph() {
	return (
		<>
			<circle cx="12" cy="12" r="10" />
			<path d="M12 7.5 16.2 10.5 14.6 15.5h-5.2L7.8 10.5z" />
			<path d="M12 7.5V2" />
			<path d="m16.2 10.5 5.3-1.8" />
			<path d="m7.8 10.5-5.3-1.8" />
			<path d="m14.6 15.5 2.6 5.8" />
			<path d="m9.4 15.5-2.6 5.8" />
		</>
	);
}

function OwnGoalBootGlyph() {
	return (
		<>
			<path d="M16.2 12.2h2.2c.8 0 1.4.6 1.4 1.4V15" />
			<path d="M8.4 17.3c.2-1.5 1.6-2.6 3.3-2.6H19.8v2.6z" />
			<path d="M8 17.5h12.2" />
			<path d="M10.4 17.5v1.5" />
			<path d="M14 17.5v1.7" />
			<path d="M17.6 17.5v1.5" />
		</>
	);
}

export function SoccerBallIcon({
	className,
	"aria-label": ariaLabel,
}: SoccerBallIconProps) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden={ariaHiddenWhenUnlabelled(ariaLabel)}
			aria-label={ariaLabel}
			focusable="false"
		>
			<SoccerBallGlyph />
		</svg>
	);
}

export function OwnGoalIcon({
	className,
	"aria-label": ariaLabel,
}: SoccerBallIconProps) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden={ariaHiddenWhenUnlabelled(ariaLabel)}
			aria-label={ariaLabel}
			focusable="false"
		>
			<SoccerBallGlyph />
			<g className="text-surface" stroke="currentColor" strokeWidth={4}>
				<OwnGoalBootGlyph />
			</g>
			<g className="text-danger-fg" stroke="currentColor" strokeWidth={2}>
				<OwnGoalBootGlyph />
			</g>
		</svg>
	);
}
