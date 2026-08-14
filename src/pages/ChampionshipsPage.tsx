import { Link } from "@tanstack/react-router";
import { ChevronRight, Plus, Trophy } from "lucide-react";
import { SkeletonRegion } from "@/components/atoms/skeleton";
import { ChampionshipLogo } from "@/components/championship-logo";
import { EmptyState } from "@/components/empty-state";
import { ListRowSkeleton } from "@/components/molecules/list-row-skeleton";
import { PageHeader } from "@/components/page-header";
import {
	championshipQuotaHint,
	isChampionshipQuotaReached,
	ownedChampionshipCount,
} from "@/const/championship-quota";
import { CHAMPIONSHIP_VISIBILITY } from "@/const/championship-visibility";
import { ROUTES } from "@/const/routes";
import { SKELETON_LABEL, SKELETON_LIST_ROWS } from "@/const/skeleton";
import {
	BUTTON_VARIANT,
	buttonClassName,
	CHIP_CLASS,
	ERROR_CLASS,
} from "@/const/ui";
import { useAuth } from "@/contexts/auth";
import { useChampionships } from "@/hooks/championships/use-championships";

export function ChampionshipsPage() {
	const { user } = useAuth();
	const { data: championships, isPending, isError, error } = useChampionships();

	if (isPending) {
		return <ChampionshipsPageSkeleton />;
	}

	if (isError) {
		return (
			<p className={ERROR_CLASS}>
				Erro ao carregar campeonatos: {error.message}
			</p>
		);
	}

	const atLimit = isChampionshipQuotaReached(
		ownedChampionshipCount(championships, user?.id ?? ""),
	);

	return (
		<main>
			<PageHeader
				title="Campeonatos"
				description="Seus babas e peladas"
				action={
					!atLimit && (
						<Link
							to={ROUTES.championshipNew}
							className={buttonClassName(BUTTON_VARIANT.primary)}
						>
							<Plus className="size-4" />
							Novo campeonato
						</Link>
					)
				}
			/>
			{atLimit && (
				<p className="mb-4 text-sm text-fg-muted">{championshipQuotaHint()}</p>
			)}
			{championships.length === 0 && (
				<EmptyState
					icon={<Trophy className="size-10" />}
					title="Nenhum campeonato ainda"
					description="Você ainda não criou nem entrou em um campeonato."
					action={
						!atLimit && (
							<Link
								to={ROUTES.championshipNew}
								className={buttonClassName(BUTTON_VARIANT.primary)}
							>
								<Plus className="size-4" />
								Novo campeonato
							</Link>
						)
					}
				/>
			)}
			{championships.length > 0 && (
				<ul className="space-y-2">
					{championships.map((championship) => (
						<li key={championship.id}>
							<Link
								to={ROUTES.championship}
								params={{ championshipId: String(championship.id) }}
								className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-sm hover:border-pitch/30 hover:bg-pitch-soft/40"
							>
								<ChampionshipLogo
									path={championship.logo_path}
									name={championship.name}
								/>
								<span className="flex min-w-0 flex-1 items-center gap-2">
									<span className="truncate font-semibold tracking-tight text-fg">
										{championship.name}
									</span>
									{!championship.is_visible && (
										<span className={CHIP_CLASS}>
											{CHAMPIONSHIP_VISIBILITY.hiddenLabel}
										</span>
									)}
								</span>
								<ChevronRight className="size-4 text-fg-subtle" />
							</Link>
						</li>
					))}
				</ul>
			)}
		</main>
	);
}

function ChampionshipsPageSkeleton() {
	return (
		<SkeletonRegion label={SKELETON_LABEL.championships}>
			<main>
				<PageHeader
					title="Campeonatos"
					description="Seus babas e peladas"
					action={
						<Link
							to={ROUTES.championshipNew}
							className={buttonClassName(BUTTON_VARIANT.primary)}
						>
							<Plus className="size-4" />
							Novo campeonato
						</Link>
					}
				/>
				<ul className="space-y-2">
					{SKELETON_LIST_ROWS.map((row) => (
						<ListRowSkeleton key={row} />
					))}
				</ul>
			</main>
		</SkeletonRegion>
	);
}
