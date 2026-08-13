import { useNavigate } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/button";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import {
	championshipQuotaHint,
	isChampionshipQuotaReached,
	ownedChampionshipCount,
} from "@/const/championship-quota";
import { ROUTES } from "@/const/routes";
import { ERROR_CLASS, FIELD_CLASS } from "@/const/ui";
import { useAuth } from "@/contexts/auth";
import {
	useChampionships,
	useCreateChampionship,
} from "@/hooks/championships/use-championships";
import { getUserAvatarUrl, getUserDisplayName } from "@/lib/user-profile";

export function NewChampionshipPage() {
	const { user } = useAuth();
	const navigate = useNavigate();
	const createChampionship = useCreateChampionship();
	const { data: championships, isPending } = useChampionships();
	const [name, setName] = useState("");
	const atLimit = isChampionshipQuotaReached(
		ownedChampionshipCount(championships ?? [], user?.id ?? ""),
	);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!user || atLimit) {
			return;
		}

		const trimmedName = name.trim();
		if (!trimmedName) {
			return;
		}

		const championship = await createChampionship.mutateAsync({
			name: trimmedName,
			userId: user.id,
			displayName: getUserDisplayName(user),
			avatarUrl: getUserAvatarUrl(user),
		});

		await navigate({
			to: ROUTES.championship,
			params: { championshipId: String(championship.id) },
		});
	}

	if (isPending) {
		return <p className="text-stone-600">Carregando campeonatos...</p>;
	}

	return (
		<main>
			<PageHeader title="Novo campeonato" description="Dê um nome pro baba." />
			{atLimit && (
				<p className="text-sm text-stone-600">{championshipQuotaHint()}</p>
			)}
			{!atLimit && (
				<SectionCard
					title="Dados"
					icon={<Trophy className="size-4 text-pitch" />}
				>
					<form onSubmit={handleSubmit} className="space-y-4">
						<label className="block text-sm font-medium text-stone-700">
							Nome
							<input
								value={name}
								onChange={(event) => setName(event.target.value)}
								required
								className={`mt-1 ${FIELD_CLASS}`}
							/>
						</label>
						<Button type="submit" disabled={createChampionship.isPending}>
							Criar
						</Button>
						{createChampionship.isError && (
							<p className={ERROR_CLASS}>{createChampionship.error.message}</p>
						)}
					</form>
				</SectionCard>
			)}
		</main>
	);
}
