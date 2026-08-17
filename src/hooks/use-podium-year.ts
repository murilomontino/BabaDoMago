import { useQueryState } from "nuqs";
import {
	PODIUM_YEAR_SEARCH,
	PODIUM_YEAR_SEARCH_KEY,
} from "@/const/podium-search";

export function usePodiumYear() {
	return useQueryState(PODIUM_YEAR_SEARCH_KEY, PODIUM_YEAR_SEARCH.year);
}
