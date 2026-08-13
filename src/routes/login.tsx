import { createFileRoute } from "@tanstack/react-router";
import { requireGuest } from "@/lib/auth-route-guards";
import { LoginPage } from "@/pages/LoginPage";

export type LoginSearch = {
	redirect?: string;
};

export const Route = createFileRoute("/login")({
	validateSearch: (search: Record<string, unknown>): LoginSearch => ({
		redirect: typeof search.redirect === "string" ? search.redirect : undefined,
	}),
	beforeLoad: ({ search }) => requireGuest(search.redirect),
	component: LoginPage,
});
