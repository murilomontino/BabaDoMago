import { useState } from "react";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import {
	EVENT_TEAM_CHIP_TIP,
	EventTeamChip,
} from "@/components/event-team-player";
import { EVENT_MATCH_SWAP_TEAM_LABEL } from "@/const/championship-event-match";
import { eventTeamName } from "@/const/event-team-color";
import { BUTTON_VARIANT, ERROR_CLASS, MODAL_CLASS } from "@/const/ui";
import type { ChampionshipEventTeam } from "@/types/championship-event";

type ChampionshipEventSwapTeamModalProps = {
	candidates: readonly ChampionshipEventTeam[];
	isPending?: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onConfirm: (incomingTeamId: number) => void;
};

export function ChampionshipEventSwapTeamModal({
	candidates,
	isPending = false,
	errorMessage,
	onCancel,
	onConfirm,
}: ChampionshipEventSwapTeamModalProps) {
	const [incomingTeamId, setIncomingTeamId] = useState<number | null>(null);
	const canConfirm = incomingTeamId !== null && !isPending;

	return (
		<AppDialog onClose={onCancel}>
			<div className={MODAL_CLASS}>
				<p className="mb-1 text-sm font-medium tracking-tight text-fg">
					{EVENT_MATCH_SWAP_TEAM_LABEL.title}
				</p>
				<p className="mb-3 text-sm text-fg-muted">
					{EVENT_MATCH_SWAP_TEAM_LABEL.hint}
				</p>
				{candidates.length === 0 && (
					<p className="mb-3 text-sm text-fg-muted">
						{EVENT_MATCH_SWAP_TEAM_LABEL.empty}
					</p>
				)}
				{candidates.length > 0 && (
					<ul className="mb-3 grid max-h-64 gap-2 overflow-y-auto">
						{candidates.map((team) => {
							const selected = team.id === incomingTeamId;

							return (
								<li key={team.id}>
									<button
										type="button"
										aria-pressed={selected}
										disabled={isPending}
										className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium disabled:opacity-50 ${
											selected
												? "border-pitch ring-2 ring-pitch"
												: "border-line bg-surface"
										}`}
										onClick={() => {
											setIncomingTeamId(team.id);
										}}
									>
										<EventTeamChip
											color={team.color}
											sortOrder={team.sort_order}
											tip={EVENT_TEAM_CHIP_TIP.both}
										/>
										<span className="min-w-0 flex-1 truncate">
											{eventTeamName(team.color, team.sort_order)}
										</span>
									</button>
								</li>
							);
						})}
					</ul>
				)}
				{errorMessage && (
					<p className={`mb-2 ${ERROR_CLASS}`}>{errorMessage}</p>
				)}
				<div className="mt-4 flex justify-end gap-2">
					<Button
						variant={BUTTON_VARIANT.secondary}
						onClick={onCancel}
						disabled={isPending}
					>
						{EVENT_MATCH_SWAP_TEAM_LABEL.cancel}
					</Button>
					<Button
						variant={BUTTON_VARIANT.danger}
						onClick={() => {
							if (incomingTeamId === null) {
								return;
							}

							onConfirm(incomingTeamId);
						}}
						disabled={!canConfirm}
					>
						{EVENT_MATCH_SWAP_TEAM_LABEL.confirm}
					</Button>
				</div>
			</div>
		</AppDialog>
	);
}
