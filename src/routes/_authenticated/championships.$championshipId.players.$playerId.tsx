import { createFileRoute } from "@tanstack/react-router";
import { createStandardSchemaV1 } from "nuqs";
import { PLAYER_PROFILE_TAB_SEARCH } from "@/const/player-profile-tab";
import { ChampionshipPlayerDetailPage } from "@/pages/ChampionshipPlayerDetailPage";

export const Route = createFileRoute(
	"/_authenticated/championships/$championshipId/players/$playerId",
)({
	validateSearch: createStandardSchemaV1(PLAYER_PROFILE_TAB_SEARCH, {
		partialOutput: true,
	}),
	component: ChampionshipPlayerDetailPage,
});
