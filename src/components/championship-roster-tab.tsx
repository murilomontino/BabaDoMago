import { Copy, LoaderCircle, Share2, Users } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/button";
import { ChampionshipRoster } from "@/components/championship-roster";
import { SectionCard } from "@/components/section-card";
import type { AssignableChampionshipRole } from "@/const/championship-role";
import { filterPlayersBySearch } from "@/const/player-search";
import {
	ROSTER_SHARE_LABEL,
	type RosterShareSort,
	rosterShareCard,
	sameRosterShareSort,
} from "@/const/roster-share";
import { BUTTON_VARIANT, ERROR_CLASS } from "@/const/ui";
import { CHAMPIONSHIP_BY_ID_QUERY_KEY } from "@/hooks/championships/championships-query-keys";
import { handlerWhenAllowed } from "@/lib/handler-when-allowed";
import { shareRosterImage } from "@/lib/share-roster-image";
import type { ChampionshipPlayer } from "@/types/championship";

type ChampionshipRosterTabProps = {
	players: ChampionshipPlayer[];
	createdBy: string;
	currentUserId: string | null;
	championshipName: string;
	rosterCeiling: number;
	copied: boolean;
	canInvite: boolean;
	canUpdateRating: boolean;
	canSetRoles: boolean;
	canUnlink: boolean;
	canDeactivate: boolean;
	isAddingPlayer: boolean;
	addPlayerError: string | null;
	claimingPlayerId: number | null;
	claimError: string | null;
	ratingPlayerId: number | null;
	ratingError: string | null;
	nicknamePlayerId: number | null;
	roleError: string | null;
	unlinkingPlayerId: number | null;
	unlinkError: string | null;
	canMerge: boolean;
	mergeError: string | null;
	deactivatingPlayerId: number | null;
	deactivateError: string | null;
	onCopyLink: () => void;
	onAddPlayer: (values: {
		displayNames: string[];
		rating: number;
		isGoalkeeper: boolean;
	}) => Promise<void>;
	onClaim: (playerId: number) => void;
	onChangeRating: (playerId: number, rating: number) => void;
	onEditNickname: (playerId: number) => void;
	onEditEventStats?: (playerId: number) => void;
	eventStatsPlayerId?: number | null;
	onChangeRole: (playerId: number, role: AssignableChampionshipRole) => void;
	onChangeGoalkeeper?: (playerId: number, isGoalkeeper: boolean) => void;
	goalkeeperError: string | null;
	onChangeMonthly?: (playerId: number, isMonthly: boolean) => void;
	monthlyError: string | null;
	onUnlink: (playerId: number) => void;
	onMerge: (playerId: number) => void;
	onDeactivate: (playerId: number) => void;
};

export function ChampionshipRosterTab({
	players,
	createdBy,
	currentUserId,
	championshipName,
	rosterCeiling,
	copied,
	canInvite,
	canUpdateRating,
	canSetRoles,
	canUnlink,
	canDeactivate,
	isAddingPlayer,
	addPlayerError,
	claimingPlayerId,
	claimError,
	ratingPlayerId,
	ratingError,
	nicknamePlayerId,
	roleError,
	unlinkingPlayerId,
	unlinkError,
	canMerge,
	mergeError,
	deactivatingPlayerId,
	deactivateError,
	onCopyLink,
	onAddPlayer,
	onClaim,
	onChangeRating,
	onEditNickname,
	onEditEventStats,
	eventStatsPlayerId,
	onChangeRole,
	onChangeGoalkeeper,
	goalkeeperError,
	onChangeMonthly,
	monthlyError,
	onUnlink,
	onMerge,
	onDeactivate,
}: ChampionshipRosterTabProps) {
	const [isSharing, setIsSharing] = useState(false);
	const [shareError, setShareError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [sorting, setSorting] = useState<RosterShareSort | null>(null);
	const visiblePlayers = useMemo(
		() => filterPlayersBySearch(players, searchQuery),
		[players, searchQuery],
	);
	const showShare = visiblePlayers.length > 0;
	const showActions = showShare || canInvite;

	const handleSortingChange = useCallback((next: RosterShareSort | null) => {
		setSorting((current) => {
			if (sameRosterShareSort(current, next)) {
				return current;
			}

			return next;
		});
	}, []);

	async function handleShare() {
		setIsSharing(true);
		setShareError(null);
		try {
			await shareRosterImage(
				rosterShareCard(visiblePlayers, championshipName, sorting),
				rosterCeiling,
			);
		} catch {
			setShareError(ROSTER_SHARE_LABEL.shareFailed);
		} finally {
			setIsSharing(false);
		}
	}

	return (
		<SectionCard
			title="Elenco"
			icon={<Users className="size-4 text-pitch-fg" />}
			queryKey={CHAMPIONSHIP_BY_ID_QUERY_KEY}
		>
			{showActions && (
				<div className="mb-4 flex flex-col gap-2 md:flex-row md:flex-wrap">
					{showShare && (
						<Button
							variant={BUTTON_VARIANT.secondary}
							className="w-full md:w-auto"
							disabled={isSharing}
							onClick={() => {
								void handleShare();
							}}
						>
							{isSharing && (
								<LoaderCircle className="size-4 animate-spin" aria-hidden />
							)}
							{!isSharing && <Share2 className="size-4" />}
							{isSharing && ROSTER_SHARE_LABEL.sharing}
							{!isSharing && ROSTER_SHARE_LABEL.share}
						</Button>
					)}
					{canInvite && (
						<div className="flex w-full flex-col gap-2 md:w-auto">
							{copied && (
								<span className="text-sm font-normal text-fg-muted">
									{ROSTER_SHARE_LABEL.copied}
								</span>
							)}
							<Button
								variant={BUTTON_VARIANT.secondary}
								className="w-full md:w-auto"
								onClick={onCopyLink}
							>
								<Copy className="size-4" />
								{ROSTER_SHARE_LABEL.copyInvite}
							</Button>
						</div>
					)}
				</div>
			)}
			<ChampionshipRoster
				players={players}
				createdBy={createdBy}
				currentUserId={currentUserId}
				rosterCeiling={rosterCeiling}
				searchQuery={searchQuery}
				onSearchQueryChange={setSearchQuery}
				onSortingChange={handleSortingChange}
				claimingPlayerId={claimingPlayerId}
				onClaim={onClaim}
				onChangeRating={handlerWhenAllowed(canUpdateRating, onChangeRating)}
				ratingPlayerId={ratingPlayerId}
				onEditNickname={onEditNickname}
				nicknamePlayerId={nicknamePlayerId}
				onEditEventStats={onEditEventStats}
				eventStatsPlayerId={eventStatsPlayerId}
				onChangeRole={handlerWhenAllowed(canSetRoles, onChangeRole)}
				onChangeGoalkeeper={handlerWhenAllowed(
					canUpdateRating,
					onChangeGoalkeeper,
				)}
				onChangeMonthly={handlerWhenAllowed(canUpdateRating, onChangeMonthly)}
				onUnlink={handlerWhenAllowed(canUnlink, onUnlink)}
				unlinkingPlayerId={unlinkingPlayerId}
				onMerge={handlerWhenAllowed(canMerge, onMerge)}
				onDeactivate={handlerWhenAllowed(canDeactivate, onDeactivate)}
				deactivatingPlayerId={deactivatingPlayerId}
				isAddingPlayer={isAddingPlayer}
				addPlayerError={addPlayerError}
				onAddPlayer={handlerWhenAllowed(canInvite, onAddPlayer)}
			/>
			{shareError && <p className={`mt-4 ${ERROR_CLASS}`}>{shareError}</p>}
			{claimError && <p className={`mt-4 ${ERROR_CLASS}`}>{claimError}</p>}
			{unlinkError && <p className={`mt-4 ${ERROR_CLASS}`}>{unlinkError}</p>}
			{mergeError && <p className={`mt-4 ${ERROR_CLASS}`}>{mergeError}</p>}
			{deactivateError && (
				<p className={`mt-4 ${ERROR_CLASS}`}>{deactivateError}</p>
			)}
			{ratingError && <p className={`mt-4 ${ERROR_CLASS}`}>{ratingError}</p>}
			{roleError && <p className={`mt-4 ${ERROR_CLASS}`}>{roleError}</p>}
			{goalkeeperError && (
				<p className={`mt-4 ${ERROR_CLASS}`}>{goalkeeperError}</p>
			)}
			{monthlyError && <p className={`mt-4 ${ERROR_CLASS}`}>{monthlyError}</p>}
		</SectionCard>
	);
}
