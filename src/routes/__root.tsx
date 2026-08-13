import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PAGE_SHELL_CLASS } from "@/const/ui";
import { AuthProvider } from "@/contexts/auth";

export const Route = createRootRoute({
	component: RootLayout,
	notFoundComponent: NotFound,
});

function RootLayout() {
	return (
		<AuthProvider>
			<Outlet />
		</AuthProvider>
	);
}

function NotFound() {
	return (
		<main className={`${PAGE_SHELL_CLASS} flex min-h-screen items-center`}>
			<EmptyState
				icon={<Trophy className="size-10" />}
				title="Página não encontrada."
			/>
		</main>
	);
}
