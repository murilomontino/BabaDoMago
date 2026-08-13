import { useNavigate, useParams } from "@tanstack/react-router";
import { Copy, Shield, Trash2, Users, UserX } from "lucide-react";
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
	canDeactivatePlayer,
	canDeleteChampionship,
	canInvite,
	canReactivatePlayer,
	canRenameChampionship,
	canSetRoles,
	canTransferOwnership,
	canUnlinkPlayer,
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
	useDeactivatePlayer,
	useDeleteChampionship,
	useReactivatePlayer,
	useRenameChampionship,
	useSetPlayerRole,
	useTransferChampionshipOwner,
	useUnlinkPlayer,
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
	const unlinkPlayer = useUnlinkPlayer();
	const deactivatePlayer = useDeactivatePlayer();
	const reactivatePlayer = useReactivatePlayer();
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
		(player) => !player.deleted_at && player.user_id === user?.id,
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
		unlink: canUnlinkPlayer(actorRole),
		deactivate: canDeactivatePlayer(actorRole),
		reactivate: canReactivatePlayer(actorRole),
	};
	const activePlayers = (data?.players ?? []).filter(
		(player) => !player.deleted_at,
	);
	const deactivatedPlayers = (data?.players ?? []).filter(
		(player) => player.deleted_at,
	);
	const visibleTabs = CHAMPIONSHIP_TABS.filter(
		(item) =>
			item.id !== CHAMPIONSHIP_TAB.deactivated || permissions.reactivate,
	);
	const selectedTab = visibleTabs.some((item) => item.id === tab)
		? tab
		: CHAMPIONSHIP_TAB.roster;

	function handleChangeRating(playerId: number, rating: number) {
		if (!permissions.rating) {
			return;
		}

		updateRating.mutate({ playerId, rating });
	}

	function handleUnlink(playerId: number) {
		if (!permissions.unlink) {
			return;
		}

		if (!window.confirm("Desconectar esta conta?")) {
			return;
		}

		unlinkPlayer.mutate(playerId);
	}

	function handleDeactivate(playerId: number) {
		if (!permissions.deactivate) {
			return;
		}

		if (!window.confirm("Desativar este jogador?")) {
			return;
		}

		deactivatePlayer.mutate(playerId);
	}

	function handleReactivate(playerId: number) {
		if (!permissions.reactivate) {
			return;
		}

		if (!window.confirm("Ativar este jogador?")) {
			return;
		}

		reactivatePlayer.mutate(playerId);
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
			<Tabs value={selectedTab} items={visibleTabs} onChange={setTab} />
			{selectedTab === CHAMPIONSHIP_TAB.roster && (
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
						players={activePlayers}
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
						onUnlink={permissions.unlink ? handleUnlink : undefined}
						unlinkingPlayerId={
							unlinkPlayer.isPending ? (unlinkPlayer.variables ?? null) : null
						}
						onDeactivate={permissions.deactivate ? handleDeactivate : undefined}
						deactivatingPlayerId={
							deactivatePlayer.isPending
								? (deactivatePlayer.variables ?? null)
								: null
						}
					/>
					{claimPlayer.isError && (
						<p className={`mt-4 ${ERROR_CLASS}`}>{claimPlayer.error.message}</p>
					)}
					{unlinkPlayer.isError && (
						<p className={`mt-4 ${ERROR_CLASS}`}>
							{unlinkPlayer.error.message}
						</p>
					)}
					{deactivatePlayer.isError && (
						<p className={`mt-4 ${ERROR_CLASS}`}>
							{deactivatePlayer.error.message}
						</p>
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
			{selectedTab === CHAMPIONSHIP_TAB.deactivated && (
				<SectionCard
					title="Desativados"
					icon={<UserX className="size-4 text-pitch" />}
				>
					<ChampionshipRoster
						players={deactivatedPlayers}
						createdBy={data.created_by}
						currentUserId={user?.id ?? null}
						onReactivate={handleReactivate}
						reactivatingPlayerId={
							reactivatePlayer.isPending
								? (reactivatePlayer.variables ?? null)
								: null
						}
						emptyTitle="Nenhum jogador desativado"
					/>
					{reactivatePlayer.isError && (
						<p className={`mt-4 ${ERROR_CLASS}`}>
							{reactivatePlayer.error.message}
						</p>
					)}
				</SectionCard>
			)}
			{selectedTab === CHAMPIONSHIP_TAB.settings && (
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
							<div className="space-y-4">
								{permissions.rename && (
									<form onSubmit={handleRename} className="space-y-1.5">
										<label
											htmlFor="championship-name"
											className="text-sm font-medium text-stone-700"
										>
											Nome
										</label>
										<div className="flex items-center gap-2">
											<input
												id="championship-name"
												value={nameDraft ?? data.name}
												onChange={(event) => setNameDraft(event.target.value)}
												className={`min-w-0 flex-1 ${FIELD_CLASS}`}
											/>
											<Button
												type="submit"
												variant={BUTTON_VARIANT.secondary}
												disabled={renameChampionship.isPending}
												className="h-9 shrink-0"
											>
												Salvar
											</Button>
										</div>
									</form>
								)}
								{renameChampionship.isError && (
									<p className={ERROR_CLASS}>
										{renameChampionship.error.message}
									</p>
								)}
								{permissions.transferOwnership && (
									<form onSubmit={handleTransfer} className="space-y-1.5">
										<label
											htmlFor="championship-owner"
											className="text-sm font-medium text-stone-700"
										>
											Novo dono
										</label>
										<div className="flex items-center gap-2">
											<select
												id="championship-owner"
												value={transferPlayerId}
												onChange={(event) =>
													setTransferPlayerId(event.target.value)
												}
												required
												className={`min-w-0 flex-1 ${FIELD_CLASS}`}
											>
												<option value="">Selecionar jogador</option>
												{activePlayers
													.filter(
														(player) =>
															player.user_id &&
															player.user_id !== data.created_by,
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
												className="h-9 shrink-0"
											>
												Transferir
											</Button>
										</div>
									</form>
								)}
								{transferOwner.isError && (
									<p className={ERROR_CLASS}>{transferOwner.error.message}</p>
								)}
							</div>
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
