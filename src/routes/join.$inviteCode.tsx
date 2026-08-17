import { createFileRoute } from "@tanstack/react-router";
import { optionalString } from "@/lib/unknown-value";
import { JoinChampionshipPage } from "@/pages/JoinChampionshipPage";

export type JoinSearch = {
	claim?: string;
};

export const Route = createFileRoute("/join/$inviteCode")({
	validateSearch: (search: Record<string, unknown>): JoinSearch => ({
		claim: optionalString(search.claim) ?? undefined,
	}),
	component: JoinChampionshipPage,
});
