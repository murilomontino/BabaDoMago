import { useQueryState } from "nuqs";
import {
	EVENT_BUILDER_SEARCH,
	EVENT_BUILDER_SEARCH_KEY,
} from "@/const/event-builder-search";

export function useEventBuilderStep() {
	return useQueryState(EVENT_BUILDER_SEARCH_KEY, EVENT_BUILDER_SEARCH.step);
}
