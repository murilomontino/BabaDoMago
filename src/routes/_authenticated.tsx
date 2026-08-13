import { createFileRoute } from "@tanstack/react-router";
import { requireUser } from "@/lib/auth-route-guards";
import { AuthenticatedLayout } from "@/pages/AuthenticatedLayout";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: requireUser,
	component: AuthenticatedLayout,
});
