import { useCallback, useReducer } from "react";
import {
	CHAMPIONSHIP_TRENDS_FILTERS_INITIAL,
	championshipTrendsFiltersReducer,
} from "@/const/championship-trends-filters";

export function useChampionshipTrendsFilters() {
	const [state, dispatch] = useReducer(
		championshipTrendsFiltersReducer,
		CHAMPIONSHIP_TRENDS_FILTERS_INITIAL,
	);

	const setWindow = useCallback((value: string) => {
		dispatch({ type: "SET_WINDOW", value });
	}, []);

	const setAudience = useCallback((value: string) => {
		dispatch({ type: "SET_AUDIENCE", value });
	}, []);

	const setAttendanceMetric = useCallback((value: string) => {
		dispatch({ type: "SET_ATTENDANCE_METRIC", value });
	}, []);

	const setConsistencyMetric = useCallback((value: string) => {
		dispatch({ type: "SET_CONSISTENCY_METRIC", value });
	}, []);

	const setPerformanceWindow = useCallback((value: string) => {
		dispatch({ type: "SET_PERFORMANCE_WINDOW", value });
	}, []);

	const setShowFewMatches = useCallback((value: boolean) => {
		dispatch({ type: "SET_SHOW_FEW_MATCHES", value });
	}, []);

	const setShowPerformanceNames = useCallback((value: boolean) => {
		dispatch({ type: "SET_SHOW_PERFORMANCE_NAMES", value });
	}, []);

	const setContributionMetric = useCallback((value: string) => {
		dispatch({ type: "SET_CONTRIBUTION_METRIC", value });
	}, []);

	const setShowContributionBelowMin = useCallback((value: boolean) => {
		dispatch({ type: "SET_SHOW_CONTRIBUTION_BELOW_MIN", value });
	}, []);

	const setShowContributionTable = useCallback((value: boolean) => {
		dispatch({ type: "SET_SHOW_CONTRIBUTION_TABLE", value });
	}, []);

	const setHealthMetric = useCallback((value: string) => {
		dispatch({ type: "SET_HEALTH_METRIC", value });
	}, []);

	const reset = useCallback(() => {
		dispatch({ type: "RESET" });
	}, []);

	return {
		...state,
		setWindow,
		setAudience,
		setAttendanceMetric,
		setConsistencyMetric,
		setPerformanceWindow,
		setShowFewMatches,
		setShowPerformanceNames,
		setContributionMetric,
		setShowContributionBelowMin,
		setShowContributionTable,
		setHealthMetric,
		reset,
	};
}
