import { createFileRoute } from "@tanstack/react-router";
import { createStandardSchemaV1 } from "nuqs";
import { EVENT_BUILDER_SEARCH } from "@/const/event-builder-search";
import { ChampionshipEventDetailPage } from "@/pages/ChampionshipEventDetailPage";

export const Route = createFileRoute(
	"/_authenticated/championships/$championshipId/events/$eventId",
)({
	validateSearch: createStandardSchemaV1(EVENT_BUILDER_SEARCH, {
		partialOutput: true,
	}),
	component: ChampionshipEventDetailPage,
});
