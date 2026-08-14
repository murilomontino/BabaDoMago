import { createFileRoute } from "@tanstack/react-router";
import { ChampionshipPlayerDetailPage } from "@/pages/ChampionshipPlayerDetailPage";

export const Route = createFileRoute(
	"/_authenticated/championships/$championshipId/players/$playerId",
)({
	component: ChampionshipPlayerDetailPage,
});
