import {
	CartesianGrid,
	LabelList,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { formatEventStartsAt } from "@/const/championship-event";
import {
	BALANCE_INDEX_CHART,
	BALANCE_INDEX_LABEL,
	type BalanceHistoryChartPoint,
	type EventBalanceIndex,
	balanceIndexHistoryRecentFirst,
	formatBalanceIndexScore,
	formatBalanceTightRate,
} from "@/const/championship-event-balance-index";

type ChampionshipBalanceHistoryProps = {
	history: readonly EventBalanceIndex[];
	points: readonly BalanceHistoryChartPoint[];
};

function formatPredictedScoreCell(value: number | null): string {
	if (value === null) {
		return "—";
	}

	return formatBalanceIndexScore(value);
}

type ChartTooltipPayload = {
	payload?: BalanceHistoryChartPoint;
};

function historyTooltipContent({
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
		<div className="rounded-md border border-black/10 bg-surface px-2.5 py-2 text-xs shadow-sm">
			<p className="font-medium text-fg">
				{formatEventStartsAt(point.startsAt).date}
			</p>
			<p className="text-fg-muted">
				{BALANCE_INDEX_LABEL.index}: {point.label}
			</p>
		</div>
	);
}

export function ChampionshipBalanceHistory({
	history,
	points,
}: ChampionshipBalanceHistoryProps) {
	const recentFirst = balanceIndexHistoryRecentFirst(history);

	return (
		<div className="space-y-4">
			<div className="w-full text-fg">
				<ResponsiveContainer width="100%" height={BALANCE_INDEX_CHART.height}>
					<LineChart data={[...points]} margin={BALANCE_INDEX_CHART.margin}>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="currentColor"
							opacity={0.15}
							className="text-pitch-fg"
						/>
						<XAxis
							dataKey={BALANCE_INDEX_CHART.indexKey}
							tickFormatter={(x: number) => {
								const row = points[x];
								if (!row) {
									return "";
								}

								return formatEventStartsAt(row.startsAt).date;
							}}
							tick={{ fontSize: 12 }}
						/>
						<YAxis
							width={BALANCE_INDEX_CHART.axisWidth}
							domain={[...BALANCE_INDEX_CHART.yDomain]}
							tick={{ fontSize: 12 }}
							tickFormatter={(value: number) => formatBalanceIndexScore(value)}
						/>
						<Tooltip
							content={(props) =>
								historyTooltipContent({
									active: props.active,
									payload: props.payload as
										| readonly ChartTooltipPayload[]
										| undefined,
								})
							}
						/>
						<Line
							type="monotone"
							dataKey={BALANCE_INDEX_CHART.valueKey}
							stroke="#0f766e"
							strokeWidth={2}
							dot={{ r: BALANCE_INDEX_CHART.dotRadius, fill: "#0f766e" }}
							isAnimationActive={false}
						>
							<LabelList
								dataKey={BALANCE_INDEX_CHART.labelKey}
								position="top"
								offset={BALANCE_INDEX_CHART.labelOffset}
								fontSize={BALANCE_INDEX_CHART.labelFontSize}
								fill="currentColor"
								className="tabular-nums text-fg"
							/>
						</Line>
					</LineChart>
				</ResponsiveContainer>
			</div>

			<div className="overflow-x-auto">
				<table className="w-full min-w-md text-left text-sm">
					<thead>
						<tr className="border-b border-black/10 text-xs text-fg-muted">
							<th className="py-2 pr-3 font-medium">{BALANCE_INDEX_LABEL.round}</th>
							<th className="py-2 pr-3 font-medium tabular-nums">
								{BALANCE_INDEX_LABEL.index}
							</th>
							<th className="py-2 pr-3 font-medium">
								{BALANCE_INDEX_LABEL.predicted}
							</th>
							<th className="py-2 pr-3 font-medium">
								{BALANCE_INDEX_LABEL.realized}
							</th>
							<th className="py-2 font-medium">
								{BALANCE_INDEX_LABEL.tightGames}
							</th>
						</tr>
					</thead>
					<tbody>
						{recentFirst.map((row) => (
							<tr
								key={row.eventId}
								className="border-b border-black/5 text-fg"
							>
								<td className="py-2 pr-3">
									{formatEventStartsAt(row.eventStartsAt).date}
								</td>
								<td className="py-2 pr-3 tabular-nums font-medium">
									{formatBalanceIndexScore(row.balanceIndex)}
								</td>
								<td className="py-2 pr-3 tabular-nums">
									{formatPredictedScoreCell(row.predictedScore)}
								</td>
								<td className="py-2 pr-3 tabular-nums">
									{formatBalanceIndexScore(row.realizedScore)}
								</td>
								<td className="py-2 tabular-nums">
									{formatBalanceTightRate(row.tightGameRate)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
