import { createFileRoute } from "@tanstack/react-router";
import { ChampionshipsPage } from "@/pages/ChampionshipsPage";

export const Route = createFileRoute("/_authenticated/")({
	component: ChampionshipsPage,
});
