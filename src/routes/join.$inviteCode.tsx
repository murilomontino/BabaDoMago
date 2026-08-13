import { createFileRoute } from "@tanstack/react-router";
import { JoinChampionshipPage } from "@/pages/JoinChampionshipPage";

export type JoinSearch = {
	claim?: string;
};

export const Route = createFileRoute("/join/$inviteCode")({
	validateSearch: (search: Record<string, unknown>): JoinSearch => ({
		claim: typeof search.claim === "string" ? search.claim : undefined,
	}),
	component: JoinChampionshipPage,
});
