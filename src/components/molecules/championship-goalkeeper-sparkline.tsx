import { Line, LineChart, ResponsiveContainer } from "recharts";
import type { GoalkeeperEventAverage } from "@/const/championship-goalkeeper-ranking";

const SPARK = {
	width: 64,
	height: 28,
} as const;

type ChampionshipGoalkeeperSparklineProps = {
	averages: readonly GoalkeeperEventAverage[];
};

export function ChampionshipGoalkeeperSparkline({
	averages,
}: ChampionshipGoalkeeperSparklineProps) {
	if (averages.length === 0) {
		return <span className="inline-block w-16" />;
	}

	const data = averages.map((point, index) => ({
		x: index,
		value: point.average,
	}));

	return (
		<div style={{ width: SPARK.width, height: SPARK.height }}>
			<ResponsiveContainer width="100%" height="100%">
				<LineChart
					data={data}
					margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
				>
					<Line
						type="monotone"
						dataKey="value"
						stroke="#0f766e"
						strokeWidth={1.5}
						dot={false}
						isAnimationActive={false}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}
