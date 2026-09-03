import { Switch } from "@/components/atoms/switch";
import { PLAYER_MONTHLY_LABEL } from "@/const/player-monthly";
import type { ChampionshipPlayer } from "@/types/championship";

export type RosterPlayerMonthlyProps = {
	player: ChampionshipPlayer;
	onChangeMonthly?: (playerId: number, isMonthly: boolean) => void;
};

export function RosterPlayerMonthly({
	player,
	onChangeMonthly,
}: RosterPlayerMonthlyProps) {
	const canEdit = Boolean(onChangeMonthly && !player.deleted_at);
	const switchId = `roster-monthly-${player.id}`;

	if (!canEdit) {
		return (
			<span className="text-sm text-fg-muted">
				{player.is_monthly ? "Sim" : "—"}
			</span>
		);
	}

	return (
		<label htmlFor={switchId} className="inline-flex">
			<span className="sr-only">
				{PLAYER_MONTHLY_LABEL.aria}: {player.display_name}
			</span>
			<Switch
				id={switchId}
				checked={player.is_monthly}
				onCheckedChange={(checked) => {
					if (checked === player.is_monthly) {
						return;
					}

					onChangeMonthly?.(player.id, checked);
				}}
			/>
		</label>
	);
}
