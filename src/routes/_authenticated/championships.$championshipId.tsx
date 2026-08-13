import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/_authenticated/championships/$championshipId",
)({
	component: ChampionshipLayout,
});

function ChampionshipLayout() {
	return <Outlet />;
}
