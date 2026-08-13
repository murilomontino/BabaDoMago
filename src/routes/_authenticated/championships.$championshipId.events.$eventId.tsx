import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/_authenticated/championships/$championshipId/events/$eventId",
)({
	component: ChampionshipEventLayout,
});

function ChampionshipEventLayout() {
	return <Outlet />;
}
