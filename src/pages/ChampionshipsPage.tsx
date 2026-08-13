import { Link } from "@tanstack/react-router";
import { ChampionshipLogo } from "@/components/championship-logo";
import { ROUTES } from "@/const/routes";
import { useChampionships } from "@/hooks/championships/use-championships";

export function ChampionshipsPage() {
	const { data: championships, isPending, isError, error } = useChampionships();

	if (isPending) {
		return <p>Carregando campeonatos...</p>;
	}

	if (isError) {
		return <p>Erro ao carregar campeonatos: {error.message}</p>;
	}

	return (
		<main>
			<div className="mb-6 flex items-center justify-between gap-4">
				<h1 className="text-2xl font-semibold">Campeonatos</h1>
				<Link
					to={ROUTES.championshipNew}
					className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
				>
					Novo campeonato
				</Link>
			</div>
			{championships.length === 0 && (
				<p className="text-slate-600">
					Você ainda não criou nem entrou em um campeonato.
				</p>
			)}
			{championships.length > 0 && (
				<ul className="space-y-2">
					{championships.map((championship) => (
						<li key={championship.id}>
							<Link
								to={ROUTES.championship}
								params={{ championshipId: String(championship.id) }}
								className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 font-medium hover:bg-slate-50"
							>
								<ChampionshipLogo
									path={championship.logo_path}
									name={championship.name}
								/>
								{championship.name}
							</Link>
						</li>
					))}
				</ul>
			)}
		</main>
	);
}
