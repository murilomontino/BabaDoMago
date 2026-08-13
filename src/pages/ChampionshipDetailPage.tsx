import { useNavigate, useParams } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { ChampionshipDeactivatedTab } from "@/components/championship-deactivated-tab";
import { ChampionshipDetailHeader } from "@/components/championship-detail-header";
import { ChampionshipEvents } from "@/components/championship-events";
import { ChampionshipLogoCrop } from "@/components/championship-logo-crop";
import { ChampionshipPodiumTab } from "@/components/championship-podium-tab";
import { ChampionshipRosterTab } from "@/components/championship-roster-tab";
import { ChampionshipSettingsTab } from "@/components/championship-settings-tab";
import { ConfirmRatingModal } from "@/components/confirm-rating-modal";
import { DeleteChampionshipModal } from "@/components/delete-championship-modal";
import { EditPlayerNicknameModal } from "@/components/edit-player-nickname-modal";
import { Tabs } from "@/components/tabs";
import { assertChampionshipLogoSource } from "@/const/championship-logo";
import {
	type AssignableChampionshipRole,
	CHAMPIONSHIP_ROLE,
	CHAMPIONSHIP_ROLE_LABEL,
	canDeactivatePlayer,
	canDeleteChampionship,
	canInvite,
	canManageEvent,
	canReactivatePlayer,
	canRenameChampionship,
	canSetRoles,
	canTransferOwnership,
	canUnlinkPlayer,
	canUpdateEventConfig,
	canUpdateRating,
	canUpdateVisibility,
	resolveChampionshipRole,
} from "@/const/championship-role";
import {
	CHAMPIONSHIP_TAB,
	CHAMPIONSHIP_TABS,
	type ChampionshipTab,
} from "@/const/championship-tab";
import { playerVisibleName } from "@/const/player-name";
import { championshipRatingCeiling } from "@/const/player-rating";
import { ROUTES } from "@/const/routes";
import { ERROR_CLASS } from "@/const/ui";
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
	useUpdateChampionshipEventConfig,
	useUpdateChampionshipVisibility,
	useUpdatePlayerNickname,
	useUpdatePlayerRating,
	useUploadChampionshipLogo,
} from "@/hooks/championships/use-championships";
import type { ChampionshipPlayer } from "@/types/championship";

export function ChampionshipDetailPage() {
	const { championshipId: championshipIdParam } = useParams({
		from: "/_authenticated/championships/$championshipId/",
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
	const updateNickname = useUpdatePlayerNickname();
	const renameChampionship = useRenameChampionship(championshipId);
	const updateEventConfig = useUpdateChampionshipEventConfig(championshipId);
	const updateVisibility = useUpdateChampionshipVisibility(championshipId);
	const setPlayerRole = useSetPlayerRole();
	const deleteChampionship = useDeleteChampionship();
	const transferOwner = useTransferChampionshipOwner();
	const uploadLogo = useUploadChampionshipLogo(championshipId);
	const [copied, setCopied] = useState(false);
	const [logoCropSrc, setLogoCropSrc] = useState<string | null>(null);
	const [logoSourceError, setLogoSourceError] = useState<string | null>(null);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [pendingRatingChange, setPendingRatingChange] = useState<{
		playerId: number;
		playerName: string;
		avatarUrl: string | null;
		from: number;
		to: number;
	} | null>(null);
	const [pendingNicknamePlayer, setPendingNicknamePlayer] =
		useState<ChampionshipPlayer | null>(null);
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
		invite: canInvite(actorRole) && Boolean(data?.is_visible),
		rating: canUpdateRating(actorRole),
		rename: canRenameChampionship(actorRole),
		setRoles: canSetRoles(actorRole),
		deleteChampionship: canDeleteChampionship(actorRole),
		transferOwnership: canTransferOwnership(actorRole),
		unlink: canUnlinkPlayer(actorRole),
		deactivate: canDeactivatePlayer(actorRole),
		reactivate: canReactivatePlayer(actorRole),
		updateEventConfig: canUpdateEventConfig(actorRole),
		updateVisibility: canUpdateVisibility(actorRole),
		manageEvent: canManageEvent(actorRole),
	};
	const activePlayers = (data?.players ?? []).filter(
		(player) => !player.deleted_at,
	);
	const rosterCeiling = championshipRatingCeiling(
		activePlayers.map((player) => player.rating),
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

		const player = activePlayers.find((item) => item.id === playerId);
		if (!player) {
			return;
		}

		if (player.rating === rating) {
			return;
		}

		updateRating.reset();
		setPendingRatingChange({
			playerId: player.id,
			playerName: playerVisibleName(player),
			avatarUrl: player.avatar_url,
			from: player.rating,
			to: rating,
		});
	}

	function handleRatingCancel() {
		if (updateRating.isPending) {
			return;
		}

		updateRating.reset();
		setPendingRatingChange(null);
	}

	function handleRatingConfirm() {
		if (!pendingRatingChange) {
			return;
		}

		updateRating.mutate(
			{
				playerId: pendingRatingChange.playerId,
				rating: pendingRatingChange.to,
			},
			{
				onSuccess: () => {
					setPendingRatingChange(null);
				},
			},
		);
	}

	function handleEditNickname(playerId: number) {
		const player = activePlayers.find((item) => item.id === playerId);
		if (!player) {
			return;
		}

		updateNickname.reset();
		setPendingNicknamePlayer(player);
	}

	function handleNicknameCancel() {
		if (updateNickname.isPending) {
			return;
		}

		updateNickname.reset();
		setPendingNicknamePlayer(null);
	}

	function handleNicknameConfirm(nickname: string) {
		if (!pendingNicknamePlayer) {
			return;
		}

		const next = nickname.trim();
		const current = pendingNicknamePlayer.nickname?.trim() ?? "";
		if (next === current) {
			setPendingNicknamePlayer(null);
			return;
		}

		updateNickname.mutate(
			{ playerId: pendingNicknamePlayer.id, nickname: next },
			{
				onSuccess: () => {
					setPendingNicknamePlayer(null);
				},
			},
		);
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

	async function handleCopyLink() {
		if (!data?.is_visible) {
			return;
		}

		const url = `${window.location.origin}${ROUTES.join.replace("$inviteCode", data.invite_code)}`;
		await navigator.clipboard.writeText(url);
		setCopied(true);
	}

	function handleDeleteCancel() {
		setIsDeleteOpen(false);
	}

	async function handleDeleteConfirm() {
		await deleteChampionship.mutateAsync(championshipId);
		setIsDeleteOpen(false);
		await navigate({ to: ROUTES.home });
	}

	const isOwner = Boolean(user && data && data.created_by === user.id);

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
		return <p className="text-fg-muted">Carregando campeonato...</p>;
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
			<ChampionshipDetailHeader
				name={data.name}
				logoPath={data.logo_path}
				roleLabel={CHAMPIONSHIP_ROLE_LABEL[actorRole]}
				isOwner={isOwner}
				isUploading={uploadLogo.isPending}
				logoSourceError={logoSourceError}
				uploadError={uploadLogo.isError ? uploadLogo.error.message : null}
				onLogoChange={handleLogoChange}
			/>
			{logoCropSrc && (
				<ChampionshipLogoCrop
					imageSrc={logoCropSrc}
					onCancel={handleLogoCropCancel}
					onConfirm={handleLogoCropConfirm}
				/>
			)}
			{pendingNicknamePlayer && (
				<EditPlayerNicknameModal
					player={pendingNicknamePlayer}
					isPending={updateNickname.isPending}
					errorMessage={
						updateNickname.isError ? updateNickname.error.message : null
					}
					onCancel={handleNicknameCancel}
					onConfirm={handleNicknameConfirm}
				/>
			)}
			{pendingRatingChange && (
				<ConfirmRatingModal
					playerName={pendingRatingChange.playerName}
					avatarUrl={pendingRatingChange.avatarUrl}
					from={pendingRatingChange.from}
					to={pendingRatingChange.to}
					ceiling={rosterCeiling}
					isPending={updateRating.isPending}
					errorMessage={
						updateRating.isError ? updateRating.error.message : null
					}
					onCancel={handleRatingCancel}
					onConfirm={handleRatingConfirm}
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
				<ChampionshipRosterTab
					players={activePlayers}
					createdBy={data.created_by}
					currentUserId={user?.id ?? null}
					rosterCeiling={rosterCeiling}
					copied={copied}
					canInvite={permissions.invite}
					canUpdateRating={permissions.rating}
					canSetRoles={permissions.setRoles}
					canUnlink={permissions.unlink}
					canDeactivate={permissions.deactivate}
					isAddingPlayer={addPlayer.isPending}
					addPlayerError={addPlayer.isError ? addPlayer.error.message : null}
					claimingPlayerId={claimPlayer.variables ?? null}
					claimError={claimPlayer.isError ? claimPlayer.error.message : null}
					ratingPlayerId={
						updateRating.isPending
							? (updateRating.variables?.playerId ?? null)
							: null
					}
					ratingError={
						updateRating.isError && !pendingRatingChange
							? updateRating.error.message
							: null
					}
					nicknamePlayerId={
						pendingNicknamePlayer?.id ??
						(updateNickname.isPending
							? (updateNickname.variables?.playerId ?? null)
							: null)
					}
					roleError={setPlayerRole.isError ? setPlayerRole.error.message : null}
					unlinkingPlayerId={
						unlinkPlayer.isPending ? (unlinkPlayer.variables ?? null) : null
					}
					unlinkError={unlinkPlayer.isError ? unlinkPlayer.error.message : null}
					deactivatingPlayerId={
						deactivatePlayer.isPending
							? (deactivatePlayer.variables ?? null)
							: null
					}
					deactivateError={
						deactivatePlayer.isError ? deactivatePlayer.error.message : null
					}
					onCopyLink={() => {
						void handleCopyLink();
					}}
					onAddPlayer={async (values) => {
						await addPlayer.mutateAsync(values);
					}}
					onClaim={(playerId) => claimPlayer.mutate(playerId)}
					onChangeRating={handleChangeRating}
					onEditNickname={handleEditNickname}
					onChangeRole={(playerId, role: AssignableChampionshipRole) =>
						setPlayerRole.mutate({ playerId, role })
					}
					onUnlink={handleUnlink}
					onDeactivate={handleDeactivate}
				/>
			)}
			{selectedTab === CHAMPIONSHIP_TAB.events && (
				<ChampionshipEvents
					championshipId={championshipId}
					eventTime={data.event_time}
					canManage={permissions.manageEvent}
				/>
			)}
			{selectedTab === CHAMPIONSHIP_TAB.podium && (
				<ChampionshipPodiumTab players={activePlayers} />
			)}
			{selectedTab === CHAMPIONSHIP_TAB.deactivated && (
				<ChampionshipDeactivatedTab
					players={deactivatedPlayers}
					createdBy={data.created_by}
					currentUserId={user?.id ?? null}
					reactivatingPlayerId={
						reactivatePlayer.isPending
							? (reactivatePlayer.variables ?? null)
							: null
					}
					reactivateError={
						reactivatePlayer.isError ? reactivatePlayer.error.message : null
					}
					onReactivate={handleReactivate}
				/>
			)}
			{selectedTab === CHAMPIONSHIP_TAB.settings && (
				<ChampionshipSettingsTab
					name={data.name}
					createdBy={data.created_by}
					eventTime={data.event_time}
					playersPerTeam={data.players_per_team}
					isVisible={data.is_visible}
					activePlayers={activePlayers}
					canRename={permissions.rename}
					canUpdateEventConfig={permissions.updateEventConfig}
					canUpdateVisibility={permissions.updateVisibility}
					canTransferOwnership={permissions.transferOwnership}
					canDelete={permissions.deleteChampionship}
					isRenaming={renameChampionship.isPending}
					renameError={
						renameChampionship.isError ? renameChampionship.error.message : null
					}
					isUpdatingEventConfig={updateEventConfig.isPending}
					eventConfigError={
						updateEventConfig.isError ? updateEventConfig.error.message : null
					}
					isUpdatingVisibility={updateVisibility.isPending}
					visibilityError={
						updateVisibility.isError ? updateVisibility.error.message : null
					}
					isTransferring={transferOwner.isPending}
					transferError={
						transferOwner.isError ? transferOwner.error.message : null
					}
					onRename={async (name) => {
						await renameChampionship.mutateAsync(name);
					}}
					onUpdateEventConfig={async (values) => {
						await updateEventConfig.mutateAsync(values);
					}}
					onUpdateVisibility={(isVisible) => {
						updateVisibility.mutate(isVisible);
					}}
					onTransferOwner={async (playerId) => {
						await transferOwner.mutateAsync(playerId);
					}}
					onDelete={() => setIsDeleteOpen(true)}
				/>
			)}
		</main>
	);
}
