export const TREND_LINE_CHART = {
	height: 280,
	indexKey: "x",
	valueKey: "value",
	labelKey: "label",
	margin: { top: 32, right: 28, bottom: 8, left: 0 },
	axisWidth: 44,
	labelFontSize: 12,
	labelOffset: 12,
	dotRadius: 4,
	stroke: "#0f766e",
} as const;

export type TrendLineChartPoint = {
	x: number;
	startsAt: string;
	value: number;
	label: string;
};
