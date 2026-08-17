import { createFileRoute } from "@tanstack/react-router";
import { createStandardSchemaV1 } from "nuqs";
import { CHAMPIONSHIP_TAB_SEARCH } from "@/const/championship-tab";
import { ChampionshipDetailPage } from "@/pages/ChampionshipDetailPage";

export const Route = createFileRoute(
	"/_authenticated/championships/$championshipId/",
)({
	validateSearch: createStandardSchemaV1(CHAMPIONSHIP_TAB_SEARCH, {
		partialOutput: true,
	}),
	component: ChampionshipDetailPage,
});
