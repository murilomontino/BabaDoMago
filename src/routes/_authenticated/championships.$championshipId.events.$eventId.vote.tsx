import { createFileRoute } from "@tanstack/react-router";
import { ChampionshipEventVotePage } from "@/pages/ChampionshipEventVotePage";

export const Route = createFileRoute(
	"/_authenticated/championships/$championshipId/events/$eventId/vote",
)({
	component: ChampionshipEventVotePage,
});
