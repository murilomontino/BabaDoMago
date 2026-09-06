import {
	CartesianGrid,
	ReferenceLine,
	ResponsiveContainer,
	Scatter,
	ScatterChart,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { GoalGlyph } from "@/components/goal-icon";
import {
	formatGoalScoreStateClock,
	GOAL_SCORE_STATE_CHART,
	GOAL_TIMELINE_LABEL,
	type GoalScoreStatePoint,
	type GoalScoreStateScatter,
	goalScoreStateCaption,
} from "@/const/championship-goal-timeline";

type ChampionshipGoalScoreStateChartProps = {
	scatter: GoalScoreStateScatter;
};

type ScatterTooltipPayload = {
	payload?: GoalScoreStatePoint;
};

function scatterTooltipContent({
	active,
	payload,
}: {
	active?: boolean;
	payload?: readonly ScatterTooltipPayload[];
}) {
	if (!active) {
		return null;
	}

	const point = payload?.[0]?.payload;
	if (!point) {
		return null;
	}

	return (
		<div className="rounded-md border border-black/10 bg-surface px-2.5 py-2 text-xs shadow-sm">
			<p className="font-medium tabular-nums text-fg">
				{formatGoalScoreStateClock(point)}
			</p>
			<p className="text-fg-muted">
				{GOAL_TIMELINE_LABEL.marginAxis}: {point.marginBefore} (
				{goalScoreStateCaption(point.state)})
			</p>
			{point.isOwnGoal && (
				<p className="text-danger-fg">{GOAL_TIMELINE_LABEL.ownGoal}</p>
			)}
		</div>
	);
}

function ballClassName(isOwnGoal: boolean): string {
	if (isOwnGoal) {
		return "text-danger-fg";
	}

	return "text-pitch-fg";
}

function BallDot(props: {
	cx?: number;
	cy?: number;
	payload?: GoalScoreStatePoint;
}) {
	const { cx, cy, payload } = props;
	if (cx === undefined || cy === undefined || !payload) {
		return null;
	}

	const size = GOAL_SCORE_STATE_CHART.ballSize;
	const half = size / 2;

	return (
		<g
			transform={`translate(${cx - half}, ${cy - half}) scale(${size / 18})`}
			className={ballClassName(payload.isOwnGoal)}
		>
			<GoalGlyph />
		</g>
	);
}

function paddedDomain(min: number, max: number): [number, number] {
	const low = Math.min(min, 0) - GOAL_SCORE_STATE_CHART.yPad;
	const high = Math.max(max, 0) + GOAL_SCORE_STATE_CHART.yPad;
	return [low, high];
}

export function ChampionshipGoalScoreStateChart({
	scatter,
}: ChampionshipGoalScoreStateChartProps) {
	const yDomain = paddedDomain(scatter.yMin, scatter.yMax);

	return (
		<div className="w-full text-pitch-fg">
			<ResponsiveContainer width="100%" height={GOAL_SCORE_STATE_CHART.height}>
				<ScatterChart margin={GOAL_SCORE_STATE_CHART.margin}>
					<CartesianGrid
						strokeDasharray="3 3"
						stroke="currentColor"
						opacity={0.15}
					/>
					<XAxis
						type="number"
						dataKey={GOAL_SCORE_STATE_CHART.minuteKey}
						name={GOAL_TIMELINE_LABEL.minuteAxis}
						domain={[0, scatter.xMaxMinutes]}
						allowDecimals={false}
						tick={{ fontSize: 12 }}
						label={{
							value: GOAL_TIMELINE_LABEL.minuteAxis,
							position: "insideBottom",
							offset: -4,
							fontSize: 11,
						}}
					/>
					<YAxis
						type="number"
						dataKey={GOAL_SCORE_STATE_CHART.marginKey}
						name={GOAL_TIMELINE_LABEL.marginAxis}
						domain={yDomain}
						allowDecimals={false}
						width={GOAL_SCORE_STATE_CHART.axisWidth}
						tick={{ fontSize: 12 }}
						label={{
							value: GOAL_TIMELINE_LABEL.marginAxis,
							angle: -90,
							position: "insideLeft",
							fontSize: 11,
						}}
					/>
					<ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.35} />
					<Tooltip content={scatterTooltipContent} />
					<Scatter data={[...scatter.points]} shape={BallDot} />
				</ScatterChart>
			</ResponsiveContainer>
		</div>
	);
}
