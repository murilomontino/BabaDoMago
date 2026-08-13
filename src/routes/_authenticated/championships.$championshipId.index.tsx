import { createFileRoute } from "@tanstack/react-router";
import { ChampionshipDetailPage } from "@/pages/ChampionshipDetailPage";

export const Route = createFileRoute(
	"/_authenticated/championships/$championshipId/",
)({
	component: ChampionshipDetailPage,
});
