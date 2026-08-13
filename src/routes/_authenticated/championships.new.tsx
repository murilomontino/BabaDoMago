import { createFileRoute } from "@tanstack/react-router";
import { NewChampionshipPage } from "@/pages/NewChampionshipPage";

export const Route = createFileRoute("/_authenticated/championships/new")({
	component: NewChampionshipPage,
});
