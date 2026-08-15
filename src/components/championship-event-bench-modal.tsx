import { useEffect, useMemo, useRef, useState } from "react";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { EventTeamPlayerRow } from "@/components/event-team-player";
import { filterPlayersBySearch, PLAYER_SEARCH } from "@/const/player-search";
import {
	BUTTON_VARIANT,
	ERROR_CLASS,
	FIELD_CLASS,
	MODAL_CLASS,
} from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

const BENCH_SEARCH_ID = "event-bench-player-search";

type ChampionshipEventBenchModalProps = {
	title: string;
	players: readonly ChampionshipPlayer[];
	ceiling: number;
	emptyMessage?: string;
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onSelect: (playerId: number) => Promise<void>;
};

export function ChampionshipEventBenchModal({
	title,
	players,
	ceiling,
	emptyMessage = "Ninguém no banco.",
	isPending,
	errorMessage,
	onCancel,
	onSelect,
}: ChampionshipEventBenchModalProps) {
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
					{title}
				</p>
				{players.length === 0 && (
					<p className="text-sm text-fg-muted">{emptyMessage}</p>
				)}
				{players.length > 0 && (
					<div className="space-y-3">
						<label
							htmlFor={BENCH_SEARCH_ID}
							className="block text-sm text-fg-muted"
						>
							{PLAYER_SEARCH.label}
							<input
								id={BENCH_SEARCH_ID}
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
									<li key={player.id}>
										<Button
											variant={BUTTON_VARIANT.secondary}
											className="w-full justify-start"
											disabled={isPending}
											onClick={() => {
												void onSelect(player.id);
											}}
										>
											<EventTeamPlayerRow player={player} ceiling={ceiling} />
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
					<Button
						variant={BUTTON_VARIANT.secondary}
						onClick={onCancel}
						disabled={isPending}
					>
						Cancelar
					</Button>
				</div>
			</div>
		</AppDialog>
	);
}
