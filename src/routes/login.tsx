import { createFileRoute } from "@tanstack/react-router";
import { requireGuest } from "@/lib/auth-route-guards";
import { LoginPage } from "@/pages/LoginPage";

export const Route = createFileRoute("/login")({
	beforeLoad: requireGuest,
	component: LoginPage,
});
