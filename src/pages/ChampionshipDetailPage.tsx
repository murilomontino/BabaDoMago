import { useNavigate, useParams } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { ChampionshipLogo } from "@/components/championship-logo";
import { ChampionshipRoster } from "@/components/championship-roster";
import { CHAMPIONSHIP_LOGO } from "@/const/championship-logo";
import {
	type AssignableChampionshipRole,
	CHAMPIONSHIP_ROLE,
	canDeleteChampionship,
	canInvite,
	canRenameChampionship,
	canSetRoles,
	canTransferOwnership,
	canUpdateRating,
	resolveChampionshipRole,
} from "@/const/championship-role";
import { ROUTES } from "@/const/routes";
import { useAuth } from "@/contexts/auth";
import {
	useAddManualPlayer,
	useChampionship,
	useClaimPlayer,
	useDeleteChampionship,
	useRenameChampionship,
	useSetPlayerRole,
	useTransferChampionshipOwner,
	useUpdatePlayerRating,
	useUploadChampionshipLogo,
} from "@/hooks/championships/use-championships";

export function ChampionshipDetailPage() {
	const { championshipId: championshipIdParam } = useParams({
		from: "/_authenticated/championships/$championshipId",
	});
	const championshipId = Number(championshipIdParam);
	const { user } = useAuth();
	const navigate = useNavigate();
	const { data, isPending, isError, error } = useChampionship(championshipId);
	const addPlayer = useAddManualPlayer(championshipId);
	const claimPlayer = useClaimPlayer();
	const updateRating = useUpdatePlayerRating();
	const renameChampionship = useRenameChampionship(championshipId);
	const setPlayerRole = useSetPlayerRole();
	const deleteChampionship = useDeleteChampionship();
	const transferOwner = useTransferChampionshipOwner();
	const uploadLogo = useUploadChampionshipLogo(championshipId);
	const [playerName, setPlayerName] = useState("");
	const [copied, setCopied] = useState(false);
	const [nameDraft, setNameDraft] = useState<string | null>(null);
	const [transferPlayerId, setTransferPlayerId] = useState("");

	const currentPlayer = data?.players.find(
		(player) => player.user_id === user?.id,
	);
	const actorRole = resolveChampionshipRole(
		data?.created_by ?? "",
		user?.id ?? null,
		currentPlayer?.role ?? CHAMPIONSHIP_ROLE.member,
	);
	const permissions = {
		invite: canInvite(actorRole),
		rating: canUpdateRating(actorRole),
		rename: canRenameChampionship(actorRole),
		setRoles: canSetRoles(actorRole),
		deleteChampionship: canDeleteChampionship(actorRole),
		transferOwnership: canTransferOwnership(actorRole),
	};

	function handleChangeRating(playerId: number, rating: number) {
		if (!permissions.rating) {
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

	async function handleRename(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const trimmedName = nameDraft?.trim() ?? "";
		if (!trimmedName) {
			return;
		}

		await renameChampionship.mutateAsync(trimmedName);
		setNameDraft(null);
	}

	async function handleDelete() {
		if (!window.confirm("Excluir este campeonato?")) {
			return;
		}

		await deleteChampionship.mutateAsync(championshipId);
		await navigate({ to: ROUTES.home });
	}

	async function handleTransfer(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const playerId = Number(transferPlayerId);
		if (!Number.isFinite(playerId)) {
			return;
		}

		if (!window.confirm("Transferir o campeonato? Você vira Normal.")) {
			return;
		}

		await transferOwner.mutateAsync(playerId);
		setTransferPlayerId("");
	}

	const isOwner = Boolean(user && data && data.created_by === user.id);

	function handleLogoChange(event: FormEvent<HTMLInputElement>) {
		const file = event.currentTarget.files?.[0];
		event.currentTarget.value = "";
		if (!file || !data || data.created_by !== user?.id) {
			return;
		}

		uploadLogo.mutate({ file, previousPath: data.logo_path });
	}

	if (isPending) {
		return <p>Carregando campeonato...</p>;
	}

	if (isError) {
		return <p>Erro ao carregar campeonato: {error.message}</p>;
	}

	return (
		<main>
			<div className="mb-2 flex items-center gap-3">
				<ChampionshipLogo
					path={data.logo_path}
					name={data.name}
					className="h-14 w-14 rounded-lg object-cover"
				/>
				<h1 className="text-2xl font-semibold">{data.name}</h1>
			</div>
			{isOwner && (
				<label className="mb-4 inline-block cursor-pointer text-sm text-slate-600 hover:text-slate-900">
					{data.logo_path ? "Trocar logo" : "Enviar logo"}
					<input
						type="file"
						accept={`${CHAMPIONSHIP_LOGO.mimePng},${CHAMPIONSHIP_LOGO.mimeJpeg}`}
						disabled={uploadLogo.isPending}
						onChange={handleLogoChange}
						className="sr-only"
					/>
				</label>
			)}
			{permissions.rename && (
				<form onSubmit={handleRename} className="mb-4 flex max-w-md gap-2">
					<input
						value={nameDraft ?? data.name}
						onChange={(event) => setNameDraft(event.target.value)}
						aria-label="Nome do campeonato"
						className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
					/>
					<button
						type="submit"
						disabled={renameChampionship.isPending}
						className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
					>
						Salvar nome
					</button>
				</form>
			)}
			<div className="mb-6 flex flex-wrap items-center gap-3">
				{permissions.invite && (
					<button
						type="button"
						onClick={handleCopyLink}
						className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
					>
						Copiar link de convite
					</button>
				)}
				{copied && (
					<span className="text-sm text-slate-500">Link copiado.</span>
				)}
				{permissions.deleteChampionship && (
					<button
						type="button"
						onClick={handleDelete}
						disabled={deleteChampionship.isPending}
						className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
					>
						Excluir campeonato
					</button>
				)}
			</div>
			{permissions.transferOwnership && (
				<form
					onSubmit={handleTransfer}
					className="mb-6 flex max-w-md flex-wrap items-center gap-2"
				>
					<select
						value={transferPlayerId}
						onChange={(event) => setTransferPlayerId(event.target.value)}
						required
						className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
					>
						<option value="">Novo dono</option>
						{data.players
							.filter(
								(player) =>
									player.user_id && player.user_id !== data.created_by,
							)
							.map((player) => (
								<option key={player.id} value={player.id}>
									{player.display_name}
								</option>
							))}
					</select>
					<button
						type="submit"
						disabled={transferOwner.isPending}
						className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
					>
						Transferir
					</button>
				</form>
			)}
			{permissions.invite && (
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
			{renameChampionship.isError && (
				<p className="mb-4 text-sm text-red-600">
					{renameChampionship.error.message}
				</p>
			)}
			{deleteChampionship.isError && (
				<p className="mb-4 text-sm text-red-600">
					{deleteChampionship.error.message}
				</p>
			)}
			{transferOwner.isError && (
				<p className="mb-4 text-sm text-red-600">
					{transferOwner.error.message}
				</p>
			)}
			{uploadLogo.isError && (
				<p className="mb-4 text-sm text-red-600">{uploadLogo.error.message}</p>
			)}
			<ChampionshipRoster
				players={data.players}
				createdBy={data.created_by}
				currentUserId={user?.id ?? null}
				claimingPlayerId={claimPlayer.variables ?? null}
				onClaim={(playerId) => claimPlayer.mutate(playerId)}
				onChangeRating={permissions.rating ? handleChangeRating : undefined}
				ratingPlayerId={
					updateRating.isPending
						? (updateRating.variables?.playerId ?? null)
						: null
				}
				onChangeRole={
					permissions.setRoles
						? (playerId, role: AssignableChampionshipRole) =>
								setPlayerRole.mutate({ playerId, role })
						: undefined
				}
			/>
			{claimPlayer.isError && (
				<p className="mt-4 text-sm text-red-600">{claimPlayer.error.message}</p>
			)}
			{updateRating.isError && (
				<p className="mt-4 text-sm text-red-600">
					{updateRating.error.message}
				</p>
			)}
			{setPlayerRole.isError && (
				<p className="mt-4 text-sm text-red-600">
					{setPlayerRole.error.message}
				</p>
			)}
		</main>
	);
}
