import { createFileRoute } from "@tanstack/react-router";
import { ChampionshipEventPlayPage } from "@/pages/ChampionshipEventPlayPage";

export const Route = createFileRoute(
	"/_authenticated/championships/$championshipId/events/$eventId/play",
)({
	component: ChampionshipEventPlayPage,
});
