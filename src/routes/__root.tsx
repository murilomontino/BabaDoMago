import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
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
		<main className="mx-auto flex min-h-screen max-w-3xl items-center px-4">
			<EmptyState
				icon={<Trophy className="size-10" />}
				title="Página não encontrada."
			/>
		</main>
	);
}
