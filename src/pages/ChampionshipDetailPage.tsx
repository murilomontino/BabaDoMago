import { useNavigate, useParams } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { type FormEvent, lazy, Suspense, useState } from "react";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Skeleton, SkeletonRegion } from "@/components/atoms/skeleton";
import { ChampionshipDetailHeader } from "@/components/championship-detail-header";
import { ChampionshipEvents } from "@/components/championship-events";
import { ChampionshipManagementTab } from "@/components/championship-management-tab";
import { ChampionshipPodiumTab } from "@/components/championship-podium-tab";
import { ChampionshipRosterTab } from "@/components/championship-roster-tab";
import { ChampionshipSettingsTab } from "@/components/championship-settings-tab";
import { ConfirmRatingModal } from "@/components/confirm-rating-modal";
import { DeleteChampionshipModal } from "@/components/delete-championship-modal";
import { EditPlayerEventStatsModal } from "@/components/edit-player-event-stats-modal";
import { EditPlayerNicknameModal } from "@/components/edit-player-nickname-modal";
import { MergeChampionshipPlayersModal } from "@/components/merge-championship-players-modal";
import { DataTableSkeleton } from "@/components/molecules/data-table-skeleton";
import { SectionCard } from "@/components/section-card";
import { Tabs } from "@/components/tabs";
import type { PlayerEventStatsDraft } from "@/const/championship-event";
import { assertChampionshipLogoSource } from "@/const/championship-logo";
import {
	type AssignableChampionshipRole,
	CHAMPIONSHIP_ROLE,
	CHAMPIONSHIP_ROLE_LABEL,
	canDeactivatePlayer,
	canDeleteChampionship,
	canInvite,
	canManageEvent,
	canMergePlayers,
	canOverrideEndedEvent,
	canReactivatePlayer,
	canRemovePlayer,
	canRenameChampionship,
	canSetEventMvp,
	canSetRoles,
	canTransferOwnership,
	canUnlinkPlayer,
	canUpdateEventConfig,
	canUpdateRating,
	canUpdateVisibility,
	canViewManagement,
	resolveChampionshipRole,
} from "@/const/championship-role";
import {
	CHAMPIONSHIP_TAB,
	CHAMPIONSHIP_TAB_LABEL,
	type ChampionshipTab,
	championshipTabs,
	visibleChampionshipTab,
} from "@/const/championship-tab";
import {
	confirmClaimPlayerMessage,
	playerVisibleName,
} from "@/const/player-name";
import {
	championshipRatingCeiling,
	PLAYER_RATING,
} from "@/const/player-rating";
import { ROUTES } from "@/const/routes";
import { SKELETON_LABEL } from "@/const/skeleton";
import { CARD_CLASS, ERROR_CLASS, MODAL_CLASS } from "@/const/ui";
import { useAuth } from "@/contexts/auth";
import {
	useChampionshipEvents,
	useSaveChampionshipPlayerEventStats,
} from "@/hooks/championships/use-championship-events";
import {
	useAddManualPlayer,
	useChampionship,
	useClaimPlayer,
	useDeactivatePlayer,
	useDeleteChampionship,
	useMergeChampionshipPlayers,
	useReactivatePlayer,
	useRemovePlayer,
	useRenameChampionship,
	useSetPlayerIsGoalkeeper,
	useSetPlayerRole,
	useTransferChampionshipOwner,
	useUnlinkPlayer,
	useUpdateChampionshipEventConfig,
	useUpdateChampionshipVisibility,
	useUpdatePlayerNickname,
	useUpdatePlayerRating,
	useUploadChampionshipLogo,
} from "@/hooks/championships/use-championships";
import { useChampionshipTab } from "@/hooks/use-championship-tab";
import {
	caughtErrorMessage,
	mutationErrorMessage,
	pendingMutationId,
} from "@/lib/error-message";
import { handlerWhenAllowed } from "@/lib/handler-when-allowed";
import type { ChampionshipPlayer } from "@/types/championship";

const ChampionshipLogoCrop = lazy(() =>
	import("@/components/championship-logo-crop").then((m) => ({
		default: m.ChampionshipLogoCrop,
	})),
);

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
	const mergePlayers = useMergeChampionshipPlayers();
	const deactivatePlayer = useDeactivatePlayer();
	const reactivatePlayer = useReactivatePlayer();
	const removePlayer = useRemovePlayer();
	const updateRating = useUpdatePlayerRating();
	const updateNickname = useUpdatePlayerNickname();
	const eventsQuery = useChampionshipEvents(championshipId);
	const savePlayerEventStats =
		useSaveChampionshipPlayerEventStats(championshipId);
	const renameChampionship = useRenameChampionship(championshipId);
	const updateEventConfig = useUpdateChampionshipEventConfig(championshipId);
	const updateVisibility = useUpdateChampionshipVisibility(championshipId);
	const setPlayerRole = useSetPlayerRole();
	const setPlayerIsGoalkeeper = useSetPlayerIsGoalkeeper();
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
	const [pendingEventStatsPlayer, setPendingEventStatsPlayer] =
		useState<ChampionshipPlayer | null>(null);
	const [pendingMergePlayer, setPendingMergePlayer] =
		useState<ChampionshipPlayer | null>(null);
	const [tab, setTab] = useChampionshipTab();
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
		merge: canMergePlayers(actorRole),
		deactivate: canDeactivatePlayer(actorRole),
		reactivate: canReactivatePlayer(actorRole),
		remove: canRemovePlayer(actorRole),
		updateEventConfig: canUpdateEventConfig(actorRole),
		updateVisibility: canUpdateVisibility(actorRole),
		manageEvent: canManageEvent(actorRole),
		overrideEnded: canOverrideEndedEvent(actorRole),
		viewManagement: canViewManagement(actorRole),
		setMvp: canSetEventMvp(actorRole),
	};
	const requestedTab = tab ?? CHAMPIONSHIP_TAB.roster;
	const selectedTab = visibleChampionshipTab(
		requestedTab,
		permissions.viewManagement,
	);
	const activePlayers = (data?.players ?? []).filter(
		(player) => !player.deleted_at,
	);
	const rosterCeiling = championshipRatingCeiling(
		activePlayers.map((player) => player.rating),
	);
	const deactivatedPlayers = (data?.players ?? []).filter(
		(player) => player.deleted_at,
	);
	const canOpenSettings =
		permissions.rename ||
		permissions.updateEventConfig ||
		permissions.updateVisibility ||
		permissions.transferOwnership ||
		permissions.deleteChampionship ||
		permissions.reactivate ||
		permissions.remove;

	const tabs = championshipTabs(permissions.viewManagement);

	function handleTabChange(id: ChampionshipTab) {
		setIsSettingsOpen(false);
		void setTab(id);
	}

	function applyRating(playerId: number, rating: number) {
		updateRating.mutate(
			{ playerId, rating },
			{
				onSuccess: () => {
					setPendingRatingChange(null);
				},
			},
		);
	}

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
		if (player.rating === PLAYER_RATING.min) {
			applyRating(player.id, rating);
			return;
		}

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

		applyRating(pendingRatingChange.playerId, pendingRatingChange.to);
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

	function handleEditEventStats(playerId: number) {
		if (!permissions.overrideEnded) {
			return;
		}

		const player = activePlayers.find((item) => item.id === playerId);
		if (!player) {
			return;
		}

		savePlayerEventStats.reset();
		setPendingEventStatsPlayer(player);
	}

	function handleEventStatsCancel() {
		if (savePlayerEventStats.isPending) {
			return;
		}

		savePlayerEventStats.reset();
		setPendingEventStatsPlayer(null);
	}

	async function handleEventStatsSave(
		eventId: number,
		stats: PlayerEventStatsDraft,
	) {
		if (!pendingEventStatsPlayer) {
			return;
		}

		await savePlayerEventStats.mutateAsync({
			playerId: pendingEventStatsPlayer.id,
			eventId,
			stats,
		});
		setPendingEventStatsPlayer(null);
	}

	function handleClaim(playerId: number) {
		const player = activePlayers.find((item) => item.id === playerId);
		if (!player) {
			return;
		}

		if (!window.confirm(confirmClaimPlayerMessage(playerVisibleName(player)))) {
			return;
		}

		claimPlayer.mutate(playerId);
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

	function handleMerge(playerId: number) {
		if (!permissions.merge) {
			return;
		}

		const player = activePlayers.find((item) => item.id === playerId);
		if (!player) {
			return;
		}

		mergePlayers.reset();
		setPendingMergePlayer(player);
	}

	function handleMergeCancel() {
		if (mergePlayers.isPending) {
			return;
		}

		mergePlayers.reset();
		setPendingMergePlayer(null);
	}

	function handleMergeConfirm(keepPlayerId: number, absorbPlayerId: number) {
		mergePlayers.mutate(
			{ keepPlayerId, absorbPlayerId },
			{
				onSuccess: () => {
					setPendingMergePlayer(null);
				},
			},
		);
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

	function handleRemove(playerId: number) {
		if (!permissions.remove) {
			return;
		}

		if (
			!window.confirm("Excluir este jogador? Ele não aparecerá mais na lista.")
		) {
			return;
		}

		removePlayer.mutate(playerId);
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
			setLogoSourceError(caughtErrorMessage(error, "Use PNG ou JPEG"));
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
		return <ChampionshipDetailPageSkeleton />;
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
				eventWeekday={data.event_weekday}
				eventTime={data.event_time}
				location={data.location}
				roleLabel={CHAMPIONSHIP_ROLE_LABEL[actorRole]}
				isOwner={isOwner}
				isUploading={uploadLogo.isPending}
				logoSourceError={logoSourceError}
				uploadError={mutationErrorMessage(uploadLogo)}
				canOpenSettings={canOpenSettings}
				isSettingsOpen={isSettingsOpen}
				onLogoChange={handleLogoChange}
				onToggleSettings={() => {
					setIsSettingsOpen((open) => !open);
				}}
			/>
			{logoCropSrc && (
				<Suspense
					fallback={<LogoCropSkeleton onClose={handleLogoCropCancel} />}
				>
					<ChampionshipLogoCrop
						imageSrc={logoCropSrc}
						onCancel={handleLogoCropCancel}
						onConfirm={handleLogoCropConfirm}
					/>
				</Suspense>
			)}
			{pendingNicknamePlayer && (
				<EditPlayerNicknameModal
					player={pendingNicknamePlayer}
					isPending={updateNickname.isPending}
					errorMessage={mutationErrorMessage(updateNickname)}
					onCancel={handleNicknameCancel}
					onConfirm={handleNicknameConfirm}
				/>
			)}
			{pendingMergePlayer && (
				<MergeChampionshipPlayersModal
					players={activePlayers}
					createdBy={data.created_by}
					starter={pendingMergePlayer}
					isPending={mergePlayers.isPending}
					errorMessage={mutationErrorMessage(mergePlayers)}
					onCancel={handleMergeCancel}
					onConfirm={handleMergeConfirm}
				/>
			)}
			{pendingEventStatsPlayer && (
				<EditPlayerEventStatsModal
					player={pendingEventStatsPlayer}
					events={eventsQuery.data ?? []}
					ceiling={rosterCeiling}
					isPending={savePlayerEventStats.isPending}
					errorMessage={mutationErrorMessage(savePlayerEventStats)}
					onCancel={handleEventStatsCancel}
					onSave={handleEventStatsSave}
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
					errorMessage={mutationErrorMessage(updateRating)}
					onCancel={handleRatingCancel}
					onConfirm={handleRatingConfirm}
				/>
			)}
			{isDeleteOpen && (
				<DeleteChampionshipModal
					championshipName={data.name}
					isPending={deleteChampionship.isPending}
					errorMessage={mutationErrorMessage(deleteChampionship)}
					onCancel={handleDeleteCancel}
					onConfirm={() => {
						void handleDeleteConfirm();
					}}
				/>
			)}
			{!isSettingsOpen && (
				<Tabs value={selectedTab} items={tabs} onChange={handleTabChange} />
			)}
			{!isSettingsOpen && selectedTab === CHAMPIONSHIP_TAB.roster && (
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
					addPlayerError={mutationErrorMessage(addPlayer)}
					claimingPlayerId={claimPlayer.variables ?? null}
					claimError={mutationErrorMessage(claimPlayer)}
					ratingPlayerId={pendingMutationId(updateRating)?.playerId ?? null}
					ratingError={mutationErrorMessage(
						updateRating,
						Boolean(pendingRatingChange),
					)}
					nicknamePlayerId={
						pendingNicknamePlayer?.id ??
						pendingMutationId(updateNickname)?.playerId ??
						null
					}
					roleError={mutationErrorMessage(setPlayerRole)}
					goalkeeperError={mutationErrorMessage(setPlayerIsGoalkeeper)}
					unlinkingPlayerId={pendingMutationId(unlinkPlayer)}
					unlinkError={mutationErrorMessage(unlinkPlayer)}
					canMerge={permissions.merge}
					mergeError={mutationErrorMessage(
						mergePlayers,
						Boolean(pendingMergePlayer),
					)}
					deactivatingPlayerId={pendingMutationId(deactivatePlayer)}
					deactivateError={mutationErrorMessage(deactivatePlayer)}
					onCopyLink={() => {
						void handleCopyLink();
					}}
					onAddPlayer={async (values) => {
						await addPlayer.mutateAsync(values);
					}}
					onClaim={handleClaim}
					onChangeRating={handleChangeRating}
					onEditNickname={handleEditNickname}
					onEditEventStats={handlerWhenAllowed(
						permissions.overrideEnded,
						handleEditEventStats,
					)}
					eventStatsPlayerId={
						pendingEventStatsPlayer?.id ??
						pendingMutationId(savePlayerEventStats)?.playerId ??
						null
					}
					onChangeRole={(playerId, role: AssignableChampionshipRole) =>
						setPlayerRole.mutate({ playerId, role })
					}
					onChangeGoalkeeper={(playerId, isGoalkeeper) => {
						setPlayerIsGoalkeeper.mutate({ playerId, isGoalkeeper });
					}}
					onUnlink={handleUnlink}
					onMerge={handleMerge}
					onDeactivate={handleDeactivate}
				/>
			)}
			{!isSettingsOpen && selectedTab === CHAMPIONSHIP_TAB.events && (
				<ChampionshipEvents
					championshipId={championshipId}
					eventTime={data.event_time}
					eventWeekday={data.event_weekday}
					location={data.location}
					players={activePlayers}
					canManage={permissions.manageEvent}
					canSetMvp={permissions.setMvp}
				/>
			)}
			{!isSettingsOpen && selectedTab === CHAMPIONSHIP_TAB.podium && (
				<ChampionshipPodiumTab
					players={activePlayers}
					championshipName={data.name}
					events={eventsQuery.data ?? []}
				/>
			)}
			{!isSettingsOpen &&
				selectedTab === CHAMPIONSHIP_TAB.management &&
				permissions.viewManagement && (
					<ChampionshipManagementTab
						championshipId={championshipId}
						players={activePlayers}
						events={eventsQuery.data ?? []}
						eventsPending={eventsQuery.isPending}
						eventsError={mutationErrorMessage(eventsQuery)}
					/>
				)}
			{isSettingsOpen && (
				<ChampionshipSettingsTab
					name={data.name}
					createdBy={data.created_by}
					eventTime={data.event_time}
					eventWeekday={data.event_weekday}
					location={data.location}
					playersPerTeam={data.players_per_team}
					skipGuestGoalkeeperMatches={data.skip_guest_goalkeeper_matches}
					isVisible={data.is_visible}
					activePlayers={activePlayers}
					canRename={permissions.rename}
					canUpdateEventConfig={permissions.updateEventConfig}
					canUpdateVisibility={permissions.updateVisibility}
					canTransferOwnership={permissions.transferOwnership}
					canDelete={permissions.deleteChampionship}
					canReactivate={permissions.reactivate}
					canRemove={permissions.remove}
					deactivatedPlayers={deactivatedPlayers}
					currentUserId={user?.id ?? null}
					reactivatingPlayerId={pendingMutationId(reactivatePlayer)}
					reactivateError={mutationErrorMessage(reactivatePlayer)}
					removingPlayerId={pendingMutationId(removePlayer)}
					removeError={mutationErrorMessage(removePlayer)}
					isRenaming={renameChampionship.isPending}
					renameError={mutationErrorMessage(renameChampionship)}
					isUpdatingEventConfig={updateEventConfig.isPending}
					eventConfigError={mutationErrorMessage(updateEventConfig)}
					isUpdatingVisibility={updateVisibility.isPending}
					visibilityError={mutationErrorMessage(updateVisibility)}
					isTransferring={transferOwner.isPending}
					transferError={mutationErrorMessage(transferOwner)}
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
					onReactivate={handleReactivate}
					onRemove={handleRemove}
				/>
			)}
		</main>
	);
}

function ChampionshipDetailPageSkeleton() {
	return (
		<SkeletonRegion label={SKELETON_LABEL.championship}>
			<main className="space-y-6">
				<section className={CARD_CLASS}>
					<div className="flex items-start gap-4">
						<Skeleton className="h-16 w-16 shrink-0 rounded-full" />
						<div className="min-w-0 flex-1">
							<Skeleton className="h-7 w-48" />
							<span className="mt-2 inline-flex items-center gap-1 rounded-full bg-pitch-soft px-2 py-0.5">
								<Skeleton className="h-3 w-16 rounded-full bg-pitch/20" />
							</span>
						</div>
					</div>
				</section>
				<Tabs
					value={CHAMPIONSHIP_TAB.roster}
					items={championshipTabs(false)}
					onChange={ignoreTabChange}
				/>
				<SectionCard
					title={CHAMPIONSHIP_TAB_LABEL.roster}
					icon={<Users className="size-4 text-pitch-fg" />}
				>
					<DataTableSkeleton withSearch withColumns />
				</SectionCard>
			</main>
		</SkeletonRegion>
	);
}

function ignoreTabChange() {
	return;
}

function LogoCropSkeleton({ onClose }: { onClose: () => void }) {
	return (
		<AppDialog onClose={onClose}>
			<SkeletonRegion label={SKELETON_LABEL.logoCrop} className={MODAL_CLASS}>
				<Skeleton className="mb-3 h-5 w-32" />
				<Skeleton className="h-72 w-full" />
			</SkeletonRegion>
		</AppDialog>
	);
}
