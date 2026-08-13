import { useNavigate, useParams } from "@tanstack/react-router";
import { Copy, Shield, Trash2, Users } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/button";
import { ChampionshipLogo } from "@/components/championship-logo";
import { ChampionshipLogoCrop } from "@/components/championship-logo-crop";
import { ChampionshipRoster } from "@/components/championship-roster";
import { DeleteChampionshipModal } from "@/components/delete-championship-modal";
import { EmptyState } from "@/components/empty-state";
import { SectionCard } from "@/components/section-card";
import { Tabs } from "@/components/tabs";
import {
	assertChampionshipLogoSource,
	CHAMPIONSHIP_LOGO,
} from "@/const/championship-logo";
import {
	type AssignableChampionshipRole,
	CHAMPIONSHIP_ROLE,
	CHAMPIONSHIP_ROLE_LABEL,
	canDeleteChampionship,
	canInvite,
	canRenameChampionship,
	canSetRoles,
	canTransferOwnership,
	canUpdateRating,
	resolveChampionshipRole,
} from "@/const/championship-role";
import {
	CHAMPIONSHIP_TAB,
	CHAMPIONSHIP_TABS,
	type ChampionshipTab,
} from "@/const/championship-tab";
import { ROUTES } from "@/const/routes";
import { BUTTON_VARIANT, ERROR_CLASS, FIELD_CLASS } from "@/const/ui";
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
	const [logoCropSrc, setLogoCropSrc] = useState<string | null>(null);
	const [logoSourceError, setLogoSourceError] = useState<string | null>(null);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [tab, setTab] = useState<ChampionshipTab>(CHAMPIONSHIP_TAB.roster);

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

	function handleDelete() {
		setIsDeleteOpen(true);
	}

	function handleDeleteCancel() {
		setIsDeleteOpen(false);
	}

	async function handleDeleteConfirm() {
		await deleteChampionship.mutateAsync(championshipId);
		setIsDeleteOpen(false);
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
	const canConfigure =
		permissions.rename ||
		permissions.transferOwnership ||
		permissions.deleteChampionship;

	function handleLogoChange(event: FormEvent<HTMLInputElement>) {
		const file = event.currentTarget.files?.[0];
		event.currentTarget.value = "";
		setLogoSourceError(null);
		if (!file || !data || data.created_by !== user?.id) {
			return;
		}

		try {
			assertChampionshipLogoSource(file);
		} catch (error) {
			setLogoSourceError(
				error instanceof Error ? error.message : "Use PNG ou JPEG",
			);
			return;
		}

		if (logoCropSrc) {
			URL.revokeObjectURL(logoCropSrc);
		}

		setLogoCropSrc(URL.createObjectURL(file));
	}

	function handleLogoCropCancel() {
		if (logoCropSrc) {
			URL.revokeObjectURL(logoCropSrc);
		}

		setLogoCropSrc(null);
	}

	function handleLogoCropConfirm(file: File) {
		if (!data) {
			return;
		}

		uploadLogo.mutate({ file, previousPath: data.logo_path });
		handleLogoCropCancel();
	}

	if (isPending) {
		return <p className="text-stone-600">Carregando campeonato...</p>;
	}

	if (isError) {
		return (
			<p className={ERROR_CLASS}>
				Erro ao carregar campeonato: {error.message}
			</p>
		);
	}

	return (
		<main className="space-y-6">
			<section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
				<div className="flex items-start gap-4">
					{isOwner && (
						<label
							className="cursor-pointer"
							aria-label={data.logo_path ? "Trocar logo" : "Enviar logo"}
						>
							<ChampionshipLogo
								path={data.logo_path}
								name={data.name}
								className="h-16 w-16"
							/>
							<input
								type="file"
								accept={`${CHAMPIONSHIP_LOGO.mimePng},${CHAMPIONSHIP_LOGO.mimeJpeg}`}
								disabled={uploadLogo.isPending}
								onChange={handleLogoChange}
								className="sr-only"
							/>
						</label>
					)}
					{!isOwner && (
						<ChampionshipLogo
							path={data.logo_path}
							name={data.name}
							className="h-16 w-16"
						/>
					)}
					<div className="min-w-0 flex-1">
						<h1 className="text-2xl font-semibold tracking-tight text-stone-900">
							{data.name}
						</h1>
						<span className="mt-2 inline-flex items-center gap-1 rounded-full bg-pitch-soft px-2 py-0.5 text-xs font-medium text-pitch">
							<Shield className="size-3" />
							{CHAMPIONSHIP_ROLE_LABEL[actorRole]}
						</span>
					</div>
				</div>
				{logoSourceError && (
					<p className={`mt-3 ${ERROR_CLASS}`}>{logoSourceError}</p>
				)}
				{uploadLogo.isError && (
					<p className={`mt-3 ${ERROR_CLASS}`}>{uploadLogo.error.message}</p>
				)}
			</section>
			{logoCropSrc && (
				<ChampionshipLogoCrop
					imageSrc={logoCropSrc}
					onCancel={handleLogoCropCancel}
					onConfirm={handleLogoCropConfirm}
				/>
			)}
			{isDeleteOpen && (
				<DeleteChampionshipModal
					championshipName={data.name}
					isPending={deleteChampionship.isPending}
					errorMessage={
						deleteChampionship.isError ? deleteChampionship.error.message : null
					}
					onCancel={handleDeleteCancel}
					onConfirm={() => {
						void handleDeleteConfirm();
					}}
				/>
			)}
			<Tabs value={tab} items={CHAMPIONSHIP_TABS} onChange={setTab} />
			{tab === CHAMPIONSHIP_TAB.roster && (
				<SectionCard
					title="Elenco"
					icon={<Users className="size-4 text-pitch" />}
					action={
						permissions.invite && (
							<>
								{copied && (
									<span className="text-sm font-normal text-stone-500">
										Link copiado.
									</span>
								)}
								<Button
									variant={BUTTON_VARIANT.secondary}
									onClick={handleCopyLink}
								>
									<Copy className="size-4" />
									Copiar link de convite
								</Button>
							</>
						)
					}
				>
					{permissions.invite && (
						<form onSubmit={handleAddPlayer} className="mb-4 flex gap-2">
							<input
								value={playerName}
								onChange={(event) => setPlayerName(event.target.value)}
								placeholder="Nome do jogador"
								required
								className={FIELD_CLASS}
							/>
							<Button type="submit" disabled={addPlayer.isPending}>
								Adicionar
							</Button>
						</form>
					)}
					{addPlayer.isError && (
						<p className={`mb-4 ${ERROR_CLASS}`}>{addPlayer.error.message}</p>
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
						<p className={`mt-4 ${ERROR_CLASS}`}>{claimPlayer.error.message}</p>
					)}
					{updateRating.isError && (
						<p className={`mt-4 ${ERROR_CLASS}`}>
							{updateRating.error.message}
						</p>
					)}
					{setPlayerRole.isError && (
						<p className={`mt-4 ${ERROR_CLASS}`}>
							{setPlayerRole.error.message}
						</p>
					)}
				</SectionCard>
			)}
			{tab === CHAMPIONSHIP_TAB.settings && (
				<div className="space-y-6">
					{!canConfigure && (
						<EmptyState
							icon={<Shield className="size-10" />}
							title="Nada para configurar"
							description="Você não pode alterar este campeonato."
						/>
					)}
					{(permissions.rename || permissions.transferOwnership) && (
						<SectionCard
							title="Configuração"
							icon={<Shield className="size-4 text-pitch" />}
						>
							{permissions.rename && (
								<form onSubmit={handleRename} className="mb-4 flex gap-2">
									<input
										value={nameDraft ?? data.name}
										onChange={(event) => setNameDraft(event.target.value)}
										aria-label="Nome do campeonato"
										className={FIELD_CLASS}
									/>
									<Button
										type="submit"
										variant={BUTTON_VARIANT.secondary}
										disabled={renameChampionship.isPending}
									>
										Salvar nome
									</Button>
								</form>
							)}
							{renameChampionship.isError && (
								<p className={`mb-4 ${ERROR_CLASS}`}>
									{renameChampionship.error.message}
								</p>
							)}
							{permissions.transferOwnership && (
								<form
									onSubmit={handleTransfer}
									className="flex flex-wrap items-center gap-2"
								>
									<select
										value={transferPlayerId}
										onChange={(event) =>
											setTransferPlayerId(event.target.value)
										}
										required
										className={FIELD_CLASS}
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
									<Button
										type="submit"
										variant={BUTTON_VARIANT.secondary}
										disabled={transferOwner.isPending}
									>
										Transferir
									</Button>
								</form>
							)}
							{transferOwner.isError && (
								<p className={`mt-4 ${ERROR_CLASS}`}>
									{transferOwner.error.message}
								</p>
							)}
						</SectionCard>
					)}
					{permissions.deleteChampionship && (
						<SectionCard
							title="Zona de perigo"
							icon={<Trash2 className="size-4 text-red-700" />}
						>
							<Button variant={BUTTON_VARIANT.danger} onClick={handleDelete}>
								<Trash2 className="size-4" />
								Excluir campeonato
							</Button>
						</SectionCard>
					)}
				</div>
			)}
		</main>
	);
}
