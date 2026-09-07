import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { formatEventStartsAt } from "@/const/championship-event";
import {
	formatPredictedVsRealizedValue,
	PREDICTED_VS_REALIZED_EVOLUTION_CHART,
	PREDICTED_VS_REALIZED_LABEL,
	type PredictedVsRealizedRound,
} from "@/const/championship-predicted-vs-realized";
import { TREND_LINE_CHART } from "@/const/championship-trend-line-chart";

type ChampionshipPredictedVsRealizedEvolutionProps = {
	rounds: readonly PredictedVsRealizedRound[];
};

type EvolutionPoint = {
	x: number;
	startsAt: string;
	roundMae: number;
	cumulativeMae: number;
	label: string;
};

type ChartTooltipPayload = {
	payload?: EvolutionPoint;
};

function evolutionPoints(
	rounds: readonly PredictedVsRealizedRound[],
): EvolutionPoint[] {
	return rounds.map((row, index) => ({
		x: index,
		startsAt: row.eventStartsAt,
		roundMae: row.meanAbsoluteError,
		cumulativeMae: row.cumulativeMeanAbsoluteError,
		label: String(row.roundIndex),
	}));
}

function EvolutionTooltip({
	active,
	payload,
}: {
	active?: boolean;
	payload?: readonly ChartTooltipPayload[];
}) {
	if (!active) {
		return null;
	}

	const point = payload?.[0]?.payload;
	if (!point) {
		return null;
	}

	return (
		<div className="max-w-56 rounded-md border border-black/10 bg-surface px-2.5 py-2 text-xs shadow-sm">
			<p className="font-medium text-fg">
				{PREDICTED_VS_REALIZED_LABEL.round} {point.label}
			</p>
			<p className="text-fg-muted">
				{formatEventStartsAt(point.startsAt).date}
			</p>
			<p className="text-fg-muted">
				{PREDICTED_VS_REALIZED_LABEL.evolutionRound}:{" "}
				{formatPredictedVsRealizedValue(point.roundMae)}
			</p>
			<p className="text-fg-muted">
				{PREDICTED_VS_REALIZED_LABEL.evolutionCumulative}:{" "}
				{formatPredictedVsRealizedValue(point.cumulativeMae)}
			</p>
		</div>
	);
}

export function ChampionshipPredictedVsRealizedEvolution({
	rounds,
}: ChampionshipPredictedVsRealizedEvolutionProps) {
	const points = evolutionPoints(rounds);

	return (
		<div className="space-y-2">
			<h4 className="text-sm font-semibold text-fg">
				{PREDICTED_VS_REALIZED_LABEL.evolutionTitle}
			</h4>
			<div className="w-full text-pitch-fg">
				<ResponsiveContainer
					width="100%"
					height={PREDICTED_VS_REALIZED_EVOLUTION_CHART.height}
				>
					<LineChart data={points} margin={TREND_LINE_CHART.margin}>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="currentColor"
							opacity={0.15}
						/>
						<XAxis
							dataKey={PREDICTED_VS_REALIZED_EVOLUTION_CHART.indexKey}
							tick={{ fontSize: 12 }}
							tickFormatter={(value: number) => {
								const point = points[value];
								if (!point) {
									return String(value + 1);
								}

								return point.label;
							}}
						/>
						<YAxis
							width={TREND_LINE_CHART.axisWidth}
							tick={{ fontSize: 12 }}
							tickFormatter={(value: number) =>
								formatPredictedVsRealizedValue(value)
							}
						/>
						<Tooltip content={EvolutionTooltip} />
						<Legend />
						<Line
							type="monotone"
							dataKey={PREDICTED_VS_REALIZED_EVOLUTION_CHART.roundMaeKey}
							name={PREDICTED_VS_REALIZED_LABEL.evolutionRound}
							stroke="#0f766e"
							strokeWidth={2}
							dot={{ r: TREND_LINE_CHART.dotRadius }}
						/>
						<Line
							type="monotone"
							dataKey={PREDICTED_VS_REALIZED_EVOLUTION_CHART.cumulativeMaeKey}
							name={PREDICTED_VS_REALIZED_LABEL.evolutionCumulative}
							stroke="#57534e"
							strokeWidth={2}
							strokeDasharray="4 4"
							dot={{ r: TREND_LINE_CHART.dotRadius }}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
