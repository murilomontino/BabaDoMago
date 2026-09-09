import { useEffect, useMemo, useRef, useState } from "react";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { EventTeamPlayerRow } from "@/components/event-team-player";
import {
	EVENT_TEAM_POSITION,
	EVENT_TEAM_POSITION_LABEL,
	type EventTeamPosition,
} from "@/const/championship-event";
import { EVENT_MATCH_LABEL } from "@/const/championship-event-match";
import { filterPlayersBySearch, PLAYER_SEARCH } from "@/const/player-search";
import {
	BUTTON_VARIANT,
	ERROR_CLASS,
	FIELD_CLASS,
	MODAL_CLASS,
} from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

const PRESTART_ADD_SEARCH_ID = "event-prestart-add-player-search";

type ChampionshipEventAddPrestartPlayerModalProps = {
	players: readonly ChampionshipPlayer[];
	ceiling: number;
	errorMessage?: string | null;
	onCancel: () => void;
	onSelect: (playerId: number, role: EventTeamPosition) => void;
};

export function ChampionshipEventAddPrestartPlayerModal({
	players,
	ceiling,
	errorMessage = null,
	onCancel,
	onSelect,
}: ChampionshipEventAddPrestartPlayerModalProps) {
	const [query, setQuery] = useState("");
	const searchRef = useRef<HTMLInputElement>(null);
	const visiblePlayers = useMemo(
		() => filterPlayersBySearch(players, query),
		[players, query],
	);

	useEffect(() => {
		searchRef.current?.focus();
	}, []);

	return (
		<AppDialog onClose={onCancel}>
			<div className={MODAL_CLASS}>
				<p className="mb-3 text-sm font-medium tracking-tight text-fg">
					{EVENT_MATCH_LABEL.addPlayerTitle}
				</p>
				{players.length === 0 && (
					<p className="text-sm text-fg-muted">
						{EVENT_MATCH_LABEL.addPlayerEmpty}
					</p>
				)}
				{players.length > 0 && (
					<div className="space-y-3">
						<label
							htmlFor={PRESTART_ADD_SEARCH_ID}
							className="block text-sm text-fg-muted"
						>
							{PLAYER_SEARCH.label}
							<input
								id={PRESTART_ADD_SEARCH_ID}
								ref={searchRef}
								type="search"
								value={query}
								placeholder={PLAYER_SEARCH.placeholder}
								autoComplete="off"
								className={`mt-1 ${FIELD_CLASS}`}
								onChange={(event) => {
									setQuery(event.target.value);
								}}
							/>
						</label>
						{visiblePlayers.length === 0 && (
							<p className="text-sm text-fg-muted">{PLAYER_SEARCH.empty}</p>
						)}
						{visiblePlayers.length > 0 && (
							<ul className="max-h-72 space-y-1 overflow-y-auto">
								{visiblePlayers.map((player) => (
									<li
										key={player.id}
										className="flex items-center gap-2 rounded-md bg-surface-muted px-1.5 py-1"
									>
										<div className="min-w-0 flex-1">
											<EventTeamPlayerRow
												player={player}
												ceiling={ceiling}
											/>
										</div>
										<Button
											variant={BUTTON_VARIANT.secondary}
											className="shrink-0 px-2"
											aria-label={`${EVENT_TEAM_POSITION_LABEL.goalkeeper} ${player.display_name}`}
											onClick={() => {
												onSelect(
													player.id,
													EVENT_TEAM_POSITION.goalkeeper,
												);
											}}
										>
											{EVENT_TEAM_POSITION_LABEL.goalkeeper}
										</Button>
										<Button
											variant={BUTTON_VARIANT.secondary}
											className="shrink-0 px-2"
											aria-label={`${EVENT_TEAM_POSITION_LABEL.player} ${player.display_name}`}
											onClick={() => {
												onSelect(player.id, EVENT_TEAM_POSITION.player);
											}}
										>
											{EVENT_TEAM_POSITION_LABEL.player}
										</Button>
									</li>
								))}
							</ul>
						)}
					</div>
				)}
				{errorMessage && (
					<p className={`mt-2 ${ERROR_CLASS}`}>{errorMessage}</p>
				)}
				<div className="mt-4 flex justify-end">
					<Button variant={BUTTON_VARIANT.secondary} onClick={onCancel}>
						Cancelar
					</Button>
				</div>
			</div>
		</AppDialog>
	);
}
