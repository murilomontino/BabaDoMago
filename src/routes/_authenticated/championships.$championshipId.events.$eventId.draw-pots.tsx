import { createFileRoute } from "@tanstack/react-router";
import { ChampionshipEventPotDrawPage } from "@/pages/ChampionshipEventPotDrawPage";

export const Route = createFileRoute(
	"/_authenticated/championships/$championshipId/events/$eventId/draw-pots",
)({
	component: ChampionshipEventPotDrawPage,
});
