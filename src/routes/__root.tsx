import {
	createRootRoute,
	type ErrorComponentProps,
	Outlet,
} from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PAGE_SHELL_CLASS } from "@/const/ui";
import { AuthProvider } from "@/contexts/auth";
import { ThemeProvider } from "@/contexts/theme";

export const Route = createRootRoute({
	component: RootLayout,
	errorComponent: RouteError,
	notFoundComponent: NotFound,
});

function RootLayout() {
	return (
		<ThemeProvider>
			<AuthProvider>
				<Outlet />
			</AuthProvider>
		</ThemeProvider>
	);
}

function RouteError({ error }: ErrorComponentProps) {
	const description =
		error instanceof Error ? error.message : "Erro inesperado.";

	return (
		<main className={`${PAGE_SHELL_CLASS} flex min-h-screen items-center`}>
			<EmptyState
				icon={<Trophy className="size-10" />}
				title="Algo deu errado."
				description={description}
			/>
		</main>
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
