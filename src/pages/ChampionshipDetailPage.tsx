import { useParams } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { ChampionshipRoster } from "@/components/championship-roster";
import { ROUTES } from "@/const/routes";
import { useAuth } from "@/contexts/auth";
import {
	useAddManualPlayer,
	useChampionship,
	useClaimPlayer,
	useUpdatePlayerRating,
} from "@/hooks/championships/use-championships";

export function ChampionshipDetailPage() {
	const { championshipId: championshipIdParam } = useParams({
		from: "/_authenticated/championships/$championshipId",
	});
	const championshipId = Number(championshipIdParam);
	const { user } = useAuth();
	const { data, isPending, isError, error } = useChampionship(championshipId);
	const addPlayer = useAddManualPlayer(championshipId);
	const claimPlayer = useClaimPlayer();
	const updateRating = useUpdatePlayerRating();
	const [playerName, setPlayerName] = useState("");
	const [copied, setCopied] = useState(false);

	const isOwner = Boolean(user && data && data.created_by === user.id);

	function handleChangeRating(playerId: number, rating: number) {
		if (!isOwner) {
			return;
		}

		updateRating.mutate({ playerId, rating });
	}

	async function handleAddPlayer(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const trimmedName = playerName.trim();
		if (!trimmedName) {
			return;
		}

		await addPlayer.mutateAsync(trimmedName);
		setPlayerName("");
	}

	async function handleCopyLink() {
		if (!data) {
			return;
		}

		const url = `${window.location.origin}${ROUTES.join.replace("$inviteCode", data.invite_code)}`;
		await navigator.clipboard.writeText(url);
		setCopied(true);
	}

	if (isPending) {
		return <p>Carregando campeonato...</p>;
	}

	if (isError) {
		return <p>Erro ao carregar campeonato: {error.message}</p>;
	}

	return (
		<main>
			<h1 className="mb-2 text-2xl font-semibold">{data.name}</h1>
			<div className="mb-6 flex flex-wrap items-center gap-3">
				<button
					type="button"
					onClick={handleCopyLink}
					className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
				>
					Copiar link de convite
				</button>
				{copied && (
					<span className="text-sm text-slate-500">Link copiado.</span>
				)}
			</div>
			{isOwner && (
				<form onSubmit={handleAddPlayer} className="mb-6 flex gap-2">
					<input
						value={playerName}
						onChange={(event) => setPlayerName(event.target.value)}
						placeholder="Nome do jogador"
						required
						className="flex-1 rounded-lg border border-slate-300 px-3 py-2"
					/>
					<button
						type="submit"
						disabled={addPlayer.isPending}
						className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
					>
						Adicionar
					</button>
				</form>
			)}
			{addPlayer.isError && (
				<p className="mb-4 text-sm text-red-600">{addPlayer.error.message}</p>
			)}
			<ChampionshipRoster
				players={data.players}
				currentUserId={user?.id ?? null}
				claimingPlayerId={claimPlayer.variables ?? null}
				onClaim={(playerId) => claimPlayer.mutate(playerId)}
				onChangeRating={isOwner ? handleChangeRating : undefined}
				ratingPlayerId={updateRating.variables?.playerId ?? null}
			/>
			{claimPlayer.isError && (
				<p className="mt-4 text-sm text-red-600">{claimPlayer.error.message}</p>
			)}
			{updateRating.isError && (
				<p className="mt-4 text-sm text-red-600">
					{updateRating.error.message}
				</p>
			)}
		</main>
	);
}
