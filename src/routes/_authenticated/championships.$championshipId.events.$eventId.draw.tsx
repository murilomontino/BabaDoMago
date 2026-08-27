import { createFileRoute } from "@tanstack/react-router";
import { ChampionshipEventDrawPage } from "@/pages/ChampionshipEventDrawPage";

export const Route = createFileRoute(
	"/_authenticated/championships/$championshipId/events/$eventId/draw",
)({
	component: ChampionshipEventDrawPage,
});
