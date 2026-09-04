import { CalendarCheck, UserMinus, UserPlus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { IconTooltipButton } from "@/components/molecules/icon-tooltip-button";
import { PlayerNameLink } from "@/components/molecules/player-name-link";
import { SectionCard } from "@/components/section-card";
import {
	monthlyEligiblePlayers,
	monthlyRemoveHint,
	monthlyRosterPlayers,
	PLAYER_MONTHLY_LABEL,
} from "@/const/player-monthly";
import { playerVisibleName } from "@/const/player-name";
import { filterPlayersBySearch, PLAYER_SEARCH } from "@/const/player-search";
import {
	BUTTON_VARIANT,
	CHIP_CLASS,
	ERROR_CLASS,
	FIELD_CLASS,
	MODAL_CLASS,
	PLAYER_AVATAR_CLASS,
} from "@/const/ui";
import { CHAMPIONSHIP_BY_ID_QUERY_KEY } from "@/hooks/championships/championships-query-keys";
import type { ChampionshipPlayer } from "@/types/championship";

const LIST_SEARCH_ID = "championship-monthly-search";
const ADD_SEARCH_ID = "championship-monthly-add-search";

type ChampionshipMonthlyTabProps = {
	players: ChampionshipPlayer[];
	pendingPlayerId: number | null;
	error: string | null;
	onChangeMonthly: (playerId: number, isMonthly: boolean) => void;
};

function sortByVisibleName(players: ChampionshipPlayer[]) {
	return [...players].sort((left, right) =>
		playerVisibleName(left).localeCompare(playerVisibleName(right), "pt-BR"),
	);
}

function MonthlyAddPlayerRow({ player }: { player: ChampionshipPlayer }) {
	const visibleName = playerVisibleName(player);

	return (
		<div className="flex min-w-0 items-center gap-3">
			{player.avatar_url && (
				<img
					src={player.avatar_url}
					alt=""
					referrerPolicy="no-referrer"
					className={`${PLAYER_AVATAR_CLASS} rounded-full object-cover`}
				/>
			)}
			{!player.avatar_url && (
				<span
					className={`flex items-center justify-center rounded-full bg-pitch-soft text-sm font-medium text-pitch-fg ${PLAYER_AVATAR_CLASS}`}
				>
					{visibleName.charAt(0).toUpperCase()}
				</span>
			)}
			<p className="min-w-0 truncate font-medium text-fg">{visibleName}</p>
		</div>
	);
}

export function ChampionshipMonthlyTab({
	players,
	pendingPlayerId,
	error,
	onChangeMonthly,
}: ChampionshipMonthlyTabProps) {
	const [listQuery, setListQuery] = useState("");
	const [addOpen, setAddOpen] = useState(false);
	const [addQuery, setAddQuery] = useState("");
	const [removeTarget, setRemoveTarget] = useState<ChampionshipPlayer | null>(
		null,
	);
	const addSearchRef = useRef<HTMLInputElement>(null);
	const monthlyPlayers = useMemo(
		() => sortByVisibleName(monthlyRosterPlayers(players)),
		[players],
	);
	const visibleMonthlyPlayers = useMemo(
		() => filterPlayersBySearch(monthlyPlayers, listQuery),
		[monthlyPlayers, listQuery],
	);
	const eligiblePlayers = useMemo(
		() => sortByVisibleName(monthlyEligiblePlayers(players)),
		[players],
	);
	const visibleEligiblePlayers = useMemo(
		() => filterPlayersBySearch(eligiblePlayers, addQuery),
		[eligiblePlayers, addQuery],
	);
	const isPending = pendingPlayerId !== null;

	useEffect(() => {
		if (!addOpen) {
			return;
		}

		addSearchRef.current?.focus();
	}, [addOpen]);

	function closeAdd() {
		setAddOpen(false);
		setAddQuery("");
	}

	return (
		<SectionCard
			title={PLAYER_MONTHLY_LABEL.title}
			icon={<CalendarCheck className="size-4 text-pitch-fg" />}
			queryKey={CHAMPIONSHIP_BY_ID_QUERY_KEY}
		>
			<div className="mb-4">
				<Button
					variant={BUTTON_VARIANT.secondary}
					className="w-full md:w-auto"
					onClick={() => {
						setAddOpen(true);
					}}
				>
					<UserPlus className="size-4" />
					{PLAYER_MONTHLY_LABEL.add}
				</Button>
			</div>
			{monthlyPlayers.length === 0 && (
				<EmptyState
					icon={<CalendarCheck className="size-10" />}
					title={PLAYER_MONTHLY_LABEL.empty}
				/>
			)}
			{monthlyPlayers.length > 0 && (
				<div className="space-y-3">
					<label
						htmlFor={LIST_SEARCH_ID}
						className="block text-sm text-fg-muted"
					>
						<span className="flex items-center justify-between gap-2">
							{PLAYER_SEARCH.label}
							<span className={CHIP_CLASS}>
								{`${monthlyPlayers.length} ${PLAYER_MONTHLY_LABEL.countLabel}`}
							</span>
						</span>
						<input
							id={LIST_SEARCH_ID}
							type="search"
							value={listQuery}
							placeholder={PLAYER_SEARCH.placeholder}
							autoComplete="off"
							className={`mt-1 ${FIELD_CLASS}`}
							onChange={(event) => {
								setListQuery(event.target.value);
							}}
						/>
					</label>
					{visibleMonthlyPlayers.length === 0 && (
						<p className="text-sm text-fg-muted">{PLAYER_SEARCH.empty}</p>
					)}
					{visibleMonthlyPlayers.length > 0 && (
						<ul className="divide-y divide-line">
							{visibleMonthlyPlayers.map((player) => (
								<li
									key={player.id}
									className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
								>
									<PlayerNameLink player={player} />
									<IconTooltipButton
										label={PLAYER_MONTHLY_LABEL.remove}
										variant={BUTTON_VARIANT.danger}
										disabled={isPending}
										icon={<UserMinus className="size-4" />}
										onClick={() => {
											setRemoveTarget(player);
										}}
									/>
								</li>
							))}
						</ul>
					)}
				</div>
			)}
			{error && <p className={`mt-4 ${ERROR_CLASS}`}>{error}</p>}
			{addOpen && (
				<AppDialog onClose={closeAdd}>
					<div className={MODAL_CLASS}>
						<p className="mb-3 text-sm font-medium tracking-tight text-fg">
							{PLAYER_MONTHLY_LABEL.addTitle}
						</p>
						{eligiblePlayers.length === 0 && (
							<p className="text-sm text-fg-muted">
								{PLAYER_MONTHLY_LABEL.addEmpty}
							</p>
						)}
						{eligiblePlayers.length > 0 && (
							<div className="space-y-3">
								<label
									htmlFor={ADD_SEARCH_ID}
									className="block text-sm text-fg-muted"
								>
									<span className="flex items-center justify-between gap-2">
										{PLAYER_SEARCH.label}
										<span className={CHIP_CLASS}>
											{`${visibleEligiblePlayers.length} ${PLAYER_SEARCH.filteredLabel}`}
										</span>
									</span>
									<input
										id={ADD_SEARCH_ID}
										ref={addSearchRef}
										type="search"
										value={addQuery}
										placeholder={PLAYER_SEARCH.placeholder}
										autoComplete="off"
										className={`mt-1 ${FIELD_CLASS}`}
										onChange={(event) => {
											setAddQuery(event.target.value);
										}}
									/>
								</label>
								{visibleEligiblePlayers.length === 0 && (
									<p className="text-sm text-fg-muted">{PLAYER_SEARCH.empty}</p>
								)}
								{visibleEligiblePlayers.length > 0 && (
									<ul className="max-h-80 divide-y divide-line overflow-y-auto">
										{visibleEligiblePlayers.map((player) => (
											<li key={player.id}>
												<button
													type="button"
													disabled={isPending}
													className="flex w-full items-center rounded-lg px-1 py-2 text-left hover:bg-surface-muted disabled:opacity-50"
													onClick={() => {
														onChangeMonthly(player.id, true);
														closeAdd();
													}}
												>
													<MonthlyAddPlayerRow player={player} />
												</button>
											</li>
										))}
									</ul>
								)}
							</div>
						)}
						<div className="mt-4 flex justify-end">
							<Button
								variant={BUTTON_VARIANT.secondary}
								onClick={closeAdd}
								disabled={isPending}
							>
								{PLAYER_MONTHLY_LABEL.cancel}
							</Button>
						</div>
					</div>
				</AppDialog>
			)}
			{removeTarget && (
				<AppDialog
					onClose={() => {
						setRemoveTarget(null);
					}}
				>
					<div className={MODAL_CLASS}>
						<p className="mb-1 text-sm font-medium tracking-tight text-fg">
							{PLAYER_MONTHLY_LABEL.removeTitle}
						</p>
						<p className="mb-3 text-sm text-fg-muted">
							{monthlyRemoveHint(playerVisibleName(removeTarget))}
						</p>
						<div className="mt-4 flex justify-end gap-2">
							<Button
								variant={BUTTON_VARIANT.secondary}
								disabled={isPending}
								onClick={() => {
									setRemoveTarget(null);
								}}
							>
								{PLAYER_MONTHLY_LABEL.cancel}
							</Button>
							<Button
								variant={BUTTON_VARIANT.danger}
								disabled={isPending}
								onClick={() => {
									onChangeMonthly(removeTarget.id, false);
									setRemoveTarget(null);
								}}
							>
								{PLAYER_MONTHLY_LABEL.remove}
							</Button>
						</div>
					</div>
				</AppDialog>
			)}
		</SectionCard>
	);
}
