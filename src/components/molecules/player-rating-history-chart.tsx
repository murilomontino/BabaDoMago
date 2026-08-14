import {
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
} from "@/const/player-profile";

type PlayerRatingHistoryChartProps = {
	points: readonly PlayerRatingHistoryChartPoint[];
	ceiling: number;
};

function chartDateLabel(value: unknown): string {
	return formatEventStartsAt(String(value)).date;
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
					margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
				>
					<XAxis
						dataKey={PLAYER_RATING_HISTORY_CHART.dateKey}
						tick={{ fontSize: 12 }}
						tickFormatter={chartDateLabel}
					/>
					<YAxis domain={[0, ceiling]} tick={{ fontSize: 12 }} width={36} />
					<Tooltip
						formatter={(value) => formatEventRating(Number(value))}
						labelFormatter={chartDateLabel}
					/>
					<Line
						type="linear"
						dataKey={PLAYER_RATING_HISTORY_CHART.ratingKey}
						name={PLAYER_PROFILE_LABEL.rating}
						stroke="currentColor"
						dot
						isAnimationActive={false}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}
