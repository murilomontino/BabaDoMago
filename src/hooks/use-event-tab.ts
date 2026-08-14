import { useQueryState } from "nuqs";
import {
	EVENT_TAB_SEARCH,
	EVENT_TAB_SEARCH_KEY,
} from "@/const/championship-event-tab";

export function useEventTab() {
	return useQueryState(EVENT_TAB_SEARCH_KEY, EVENT_TAB_SEARCH.tab);
}
