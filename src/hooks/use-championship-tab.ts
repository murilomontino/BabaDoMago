import { useQueryState } from "nuqs";
import {
	CHAMPIONSHIP_TAB_SEARCH,
	CHAMPIONSHIP_TAB_SEARCH_KEY,
} from "@/const/championship-tab";

export function useChampionshipTab() {
	return useQueryState(
		CHAMPIONSHIP_TAB_SEARCH_KEY,
		CHAMPIONSHIP_TAB_SEARCH.tab,
	);
}
