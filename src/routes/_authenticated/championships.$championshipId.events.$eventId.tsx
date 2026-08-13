import { createFileRoute } from "@tanstack/react-router";
import { ChampionshipEventDetailPage } from "@/pages/ChampionshipEventDetailPage";

export const Route = createFileRoute(
	"/_authenticated/championships/$championshipId/events/$eventId",
)({
	component: ChampionshipEventDetailPage,
});
