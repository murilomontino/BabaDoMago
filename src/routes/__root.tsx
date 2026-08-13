import { createRootRoute, Outlet } from "@tanstack/react-router";
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
	return <p>Página não encontrada.</p>;
}
