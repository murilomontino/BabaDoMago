import { Link } from "@tanstack/react-router";
import { ROUTES } from "@/const/routes";

export function HomePage() {
	return (
		<main>
			<h1 className="mb-2 text-2xl font-semibold">Baba do Mago</h1>
			<p className="mb-4 text-slate-600">Lista de tarefas no Supabase.</p>
			<Link to={ROUTES.todos} className="text-blue-700 underline">
				Ver tarefas
			</Link>
		</main>
	);
}
