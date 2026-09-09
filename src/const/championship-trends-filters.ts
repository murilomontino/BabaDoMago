import {
	ATTENDANCE_TREND_METRIC_DEFAULT,
	type AttendanceTrendMetric,
	parseAttendanceTrendMetric,
} from "./championship-attendance-trend.ts";
import {
	CONSISTENCY_METRIC_DEFAULT,
	type ConsistencyMetric,
	parseConsistencyMetric,
} from "./championship-consistency.ts";
import {
	CONTRIBUTION_METRIC_DEFAULT,
	type ContributionMetric,
	parseContributionMetric,
} from "./championship-contribution.ts";
import {
	EVENT_HEALTH_METRIC_DEFAULT,
	type EventHealthMetric,
	parseEventHealthMetric,
} from "./championship-event-health.ts";
import {
	PERFORMANCE_MAP_WINDOW_DEFAULT,
	type PerformanceMapWindow,
	parsePerformanceMapWindow,
} from "./championship-performance-map.ts";
import {
	TRENDS_AUDIENCE_DEFAULT,
	parseTrendsAudience,
	TRENDS_WINDOW_DEFAULT,
	parseTrendsWindow,
	type TrendsAudience,
	type TrendsWindow,
} from "./championship-trends-window.ts";

export type ChampionshipTrendsFiltersState = {
	window: TrendsWindow;
	audience: TrendsAudience;
	attendanceMetric: AttendanceTrendMetric;
	consistencyMetric: ConsistencyMetric;
	performanceWindow: PerformanceMapWindow;
	showFewMatches: boolean;
	showPerformanceNames: boolean;
	contributionMetric: ContributionMetric;
	showContributionBelowMin: boolean;
	showContributionTable: boolean;
	healthMetric: EventHealthMetric;
};

export const CHAMPIONSHIP_TRENDS_FILTERS_INITIAL: ChampionshipTrendsFiltersState =
	{
		window: TRENDS_WINDOW_DEFAULT,
		audience: TRENDS_AUDIENCE_DEFAULT,
		attendanceMetric: ATTENDANCE_TREND_METRIC_DEFAULT,
		consistencyMetric: CONSISTENCY_METRIC_DEFAULT,
		performanceWindow: PERFORMANCE_MAP_WINDOW_DEFAULT,
		showFewMatches: false,
		showPerformanceNames: false,
		contributionMetric: CONTRIBUTION_METRIC_DEFAULT,
		showContributionBelowMin: false,
		showContributionTable: true,
		healthMetric: EVENT_HEALTH_METRIC_DEFAULT,
	};

export type ChampionshipTrendsFiltersAction =
	| { type: "SET_WINDOW"; value: string }
	| { type: "SET_AUDIENCE"; value: string }
	| { type: "SET_ATTENDANCE_METRIC"; value: string }
	| { type: "SET_CONSISTENCY_METRIC"; value: string }
	| { type: "SET_PERFORMANCE_WINDOW"; value: string }
	| { type: "SET_SHOW_FEW_MATCHES"; value: boolean }
	| { type: "SET_SHOW_PERFORMANCE_NAMES"; value: boolean }
	| { type: "SET_CONTRIBUTION_METRIC"; value: string }
	| { type: "SET_SHOW_CONTRIBUTION_BELOW_MIN"; value: boolean }
	| { type: "SET_SHOW_CONTRIBUTION_TABLE"; value: boolean }
	| { type: "SET_HEALTH_METRIC"; value: string }
	| { type: "RESET" };

export function championshipTrendsFiltersReducer(
	state: ChampionshipTrendsFiltersState,
	action: ChampionshipTrendsFiltersAction,
): ChampionshipTrendsFiltersState {
	switch (action.type) {
		case "SET_WINDOW":
			return {
				...state,
				window: parseTrendsWindow(action.value),
			};
		case "SET_AUDIENCE":
			return {
				...state,
				audience: parseTrendsAudience(action.value),
			};
		case "SET_ATTENDANCE_METRIC":
			return {
				...state,
				attendanceMetric: parseAttendanceTrendMetric(action.value),
			};
		case "SET_CONSISTENCY_METRIC":
			return {
				...state,
				consistencyMetric: parseConsistencyMetric(action.value),
			};
		case "SET_PERFORMANCE_WINDOW":
			return {
				...state,
				performanceWindow: parsePerformanceMapWindow(action.value),
			};
		case "SET_SHOW_FEW_MATCHES":
			return {
				...state,
				showFewMatches: action.value,
			};
		case "SET_SHOW_PERFORMANCE_NAMES":
			return {
				...state,
				showPerformanceNames: action.value,
			};
		case "SET_CONTRIBUTION_METRIC":
			return {
				...state,
				contributionMetric: parseContributionMetric(action.value),
			};
		case "SET_SHOW_CONTRIBUTION_BELOW_MIN":
			return {
				...state,
				showContributionBelowMin: action.value,
			};
		case "SET_SHOW_CONTRIBUTION_TABLE":
			return {
				...state,
				showContributionTable: action.value,
			};
		case "SET_HEALTH_METRIC":
			return {
				...state,
				healthMetric: parseEventHealthMetric(action.value),
			};
		case "RESET":
			return { ...CHAMPIONSHIP_TRENDS_FILTERS_INITIAL };
		default: {
			const _exhaustive: never = action;
			void _exhaustive;
			return state;
		}
	}
}
