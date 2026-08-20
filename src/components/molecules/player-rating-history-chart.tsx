import {
	LabelList,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { formatEventStartsAt } from "@/const/championship-event";
import { formatEventRating } from "@/const/event-rating-adjustment";
import {
	PLAYER_PROFILE_LABEL,
	PLAYER_RATING_HISTORY_CHART,
	type PlayerRatingHistoryChartPoint,
	playerRatingHistoryChartTickLabel,
} from "@/const/player-profile";

type PlayerRatingHistoryChartProps = {
	points: readonly PlayerRatingHistoryChartPoint[];
	ceiling: number;
};

type ChartTooltipPayload = {
	payload?: PlayerRatingHistoryChartPoint;
};

function chartTooltipLabel(
	_label: unknown,
	payload: readonly ChartTooltipPayload[] | undefined,
): string {
	const startsAt = payload?.[0]?.payload?.startsAt;
	if (!startsAt) {
		return "";
	}

	return formatEventStartsAt(startsAt).date;
}

function chartPointRatingLabel(value: unknown): string {
	return formatEventRating(Number(value));
}

export function PlayerRatingHistoryChart({
	points,
	ceiling,
}: PlayerRatingHistoryChartProps) {
	if (points.length === 0) {
		return null;
	}

	return (
		<div className="w-full text-pitch-fg">
			<ResponsiveContainer
				width="100%"
				height={PLAYER_RATING_HISTORY_CHART.height}
			>
				<LineChart
					data={[...points]}
					margin={{ top: 24, right: 16, bottom: 0, left: 0 }}
				>
					<XAxis
						dataKey={PLAYER_RATING_HISTORY_CHART.indexKey}
						tick={{ fontSize: 12 }}
						interval={0}
						tickFormatter={(value) =>
							playerRatingHistoryChartTickLabel(points, Number(value))
						}
					/>
					<YAxis domain={[0, ceiling]} tick={{ fontSize: 12 }} width={36} />
					<Tooltip
						formatter={(value) => formatEventRating(Number(value))}
						labelFormatter={chartTooltipLabel}
					/>
					<Line
						type="linear"
						dataKey={PLAYER_RATING_HISTORY_CHART.ratingKey}
						name={PLAYER_PROFILE_LABEL.rating}
						stroke="currentColor"
						dot
						isAnimationActive={false}
					>
						<LabelList
							dataKey={PLAYER_RATING_HISTORY_CHART.ratingKey}
							position="top"
							offset={PLAYER_RATING_HISTORY_CHART.labelOffset}
							fontSize={PLAYER_RATING_HISTORY_CHART.labelFontSize}
							fill="currentColor"
							formatter={chartPointRatingLabel}
						/>
					</Line>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}
