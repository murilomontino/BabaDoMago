import { useQueryState } from "nuqs";
import {
	PLAYER_PROFILE_TAB_SEARCH,
	PLAYER_PROFILE_TAB_SEARCH_KEY,
} from "@/const/player-profile-tab";

export function usePlayerProfileTab() {
	return useQueryState(
		PLAYER_PROFILE_TAB_SEARCH_KEY,
		PLAYER_PROFILE_TAB_SEARCH.tab,
	);
}
