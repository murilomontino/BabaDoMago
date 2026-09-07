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
import {
	formatPredictedVsRealizedSigned,
	formatPredictedVsRealizedValue,
	PREDICTED_VS_REALIZED_CHART,
	PREDICTED_VS_REALIZED_LABEL,
	type PredictedVsRealizedMatch,
	predictedVsRealizedFavoriteWonCaption,
	predictedVsRealizedRoundCaption,
} from "@/const/championship-predicted-vs-realized";

type ChampionshipPredictedVsRealizedScatterProps = {
	matches: readonly PredictedVsRealizedMatch[];
	onMatchClick?: (match: PredictedVsRealizedMatch) => void;
};

type ScatterTooltipPayload = {
	payload?: PredictedVsRealizedMatch;
};

function axisMax(matches: readonly PredictedVsRealizedMatch[]): number {
	const values = matches.flatMap((row) => [
		row.predictedDifference,
		row.realizedDifference,
	]);
	const highest = Math.max(0, ...values);
	return Math.max(1, Math.ceil(highest + 0.5));
}

function ScatterTooltipContent({
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
		<div className="max-w-64 rounded-md border border-black/10 bg-surface px-2.5 py-2 text-xs shadow-sm">
			<p className="font-medium text-fg">
				{predictedVsRealizedRoundCaption(point.roundIndex, point.eventStartsAt)}
			</p>
			<p className="text-fg-muted">
				{PREDICTED_VS_REALIZED_LABEL.match} {point.matchIndex}
			</p>
			<p className="mt-1 tabular-nums text-fg">
				{point.teamALabel} {point.teamAGoals} × {point.teamBGoals}{" "}
				{point.teamBLabel}
			</p>
			<p className="text-fg-muted">
				{PREDICTED_VS_REALIZED_LABEL.predicted}:{" "}
				{formatPredictedVsRealizedValue(point.predictedDifference)}
			</p>
			<p className="text-fg-muted">
				{PREDICTED_VS_REALIZED_LABEL.realized}:{" "}
				{formatPredictedVsRealizedValue(point.realizedDifference)}
			</p>
			<p className="text-fg-muted">
				{PREDICTED_VS_REALIZED_LABEL.error}:{" "}
				{formatPredictedVsRealizedSigned(point.error)}
			</p>
			{point.favoriteLabel !== null && (
				<p className="text-fg-muted">
					{PREDICTED_VS_REALIZED_LABEL.favorite}: {point.favoriteLabel}
				</p>
			)}
			<p className="text-fg-muted">
				{PREDICTED_VS_REALIZED_LABEL.favoriteWin}:{" "}
				{predictedVsRealizedFavoriteWonCaption(point.favoriteWon)}
			</p>
		</div>
	);
}

function ScatterDot(props: {
	cx?: number;
	cy?: number;
	payload?: PredictedVsRealizedMatch;
}) {
	const { cx, cy, payload } = props;
	if (cx === undefined || cy === undefined || !payload) {
		return null;
	}

	return (
		<circle
			cx={cx}
			cy={cy}
			r={PREDICTED_VS_REALIZED_CHART.dotRadius}
			fill={PREDICTED_VS_REALIZED_CHART.pointFill}
			stroke="white"
			strokeWidth={1}
		/>
	);
}

function scatterCursorStyle(
	onMatchClick?: (match: PredictedVsRealizedMatch) => void,
): { cursor: "pointer" } | undefined {
	if (!onMatchClick) {
		return undefined;
	}

	return { cursor: "pointer" };
}

function scatterClickMatch(data: unknown): PredictedVsRealizedMatch | null {
	if (!data || typeof data !== "object") {
		return null;
	}

	if (!("payload" in data)) {
		return null;
	}

	const payload = data.payload;
	if (!payload || typeof payload !== "object") {
		return null;
	}

	if (!("matchId" in payload) || !("eventId" in payload)) {
		return null;
	}

	return payload as PredictedVsRealizedMatch;
}

export function ChampionshipPredictedVsRealizedScatter({
	matches,
	onMatchClick,
}: ChampionshipPredictedVsRealizedScatterProps) {
	const max = axisMax(matches);

	return (
		<div className="w-full text-pitch-fg">
			<ResponsiveContainer
				width="100%"
				height={PREDICTED_VS_REALIZED_CHART.height}
			>
				<ScatterChart margin={PREDICTED_VS_REALIZED_CHART.margin}>
					<CartesianGrid
						strokeDasharray="3 3"
						stroke="currentColor"
						opacity={0.15}
					/>
					<XAxis
						type="number"
						dataKey={PREDICTED_VS_REALIZED_CHART.predictedKey}
						name={PREDICTED_VS_REALIZED_LABEL.predicted}
						domain={[0, max]}
						tick={{ fontSize: 12 }}
						label={{
							value: PREDICTED_VS_REALIZED_LABEL.predicted,
							position: "insideBottom",
							offset: -4,
							fontSize: 11,
						}}
					/>
					<YAxis
						type="number"
						dataKey={PREDICTED_VS_REALIZED_CHART.realizedKey}
						name={PREDICTED_VS_REALIZED_LABEL.realized}
						domain={[0, max]}
						width={PREDICTED_VS_REALIZED_CHART.axisWidth}
						tick={{ fontSize: 12 }}
						label={{
							value: PREDICTED_VS_REALIZED_LABEL.realized,
							angle: -90,
							position: "insideLeft",
							fontSize: 11,
						}}
					/>
					<Tooltip content={ScatterTooltipContent} />
					<ReferenceLine
						segment={[
							{ x: 0, y: 0 },
							{ x: max, y: max },
						]}
						stroke={PREDICTED_VS_REALIZED_CHART.referenceStroke}
						strokeDasharray="4 4"
						ifOverflow="extendDomain"
					/>
					<Scatter
						data={[...matches]}
						shape={ScatterDot}
						style={scatterCursorStyle(onMatchClick)}
						onClick={(data) => {
							if (!onMatchClick) {
								return;
							}

							const point = scatterClickMatch(data);
							if (!point) {
								return;
							}

							onMatchClick(point);
						}}
					/>
				</ScatterChart>
			</ResponsiveContainer>
			<p className="mt-1 text-xs text-fg-muted">
				{PREDICTED_VS_REALIZED_LABEL.perfectLine}
			</p>
		</div>
	);
}
