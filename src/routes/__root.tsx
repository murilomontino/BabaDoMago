import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
	component: RootLayout,
	notFoundComponent: NotFound,
});

function RootLayout() {
	return (
		<div className="mx-auto min-h-screen max-w-3xl px-4 py-8">
			<nav className="mb-8 flex gap-4">
				<Link
					to="/"
					className="font-medium text-slate-700 hover:text-slate-900"
				>
					Início
				</Link>
				<Link
					to="/todos"
					className="font-medium text-slate-700 hover:text-slate-900"
				>
					Tarefas
				</Link>
			</nav>
			<Outlet />
		</div>
	);
}

function NotFound() {
	return <p>Página não encontrada.</p>;
}
