import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { EVENT_ACTION } from "@/const/championship-event";
import {
	EVENT_MATCH_REMOVE_PLAYER_LABEL,
	eventMatchRemovePlayerTitle,
} from "@/const/championship-event-match";
import { BUTTON_VARIANT, ERROR_CLASS, MODAL_CLASS } from "@/const/ui";

type ChampionshipEventRemovePlayerModalProps = {
	playerName: string;
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onConfirm: () => void;
};

export function ChampionshipEventRemovePlayerModal({
	playerName,
	isPending,
	errorMessage,
	onCancel,
	onConfirm,
}: ChampionshipEventRemovePlayerModalProps) {
	return (
		<AppDialog onClose={onCancel}>
			<div className={MODAL_CLASS}>
				<p className="mb-1 text-sm font-medium tracking-tight text-fg">
					{eventMatchRemovePlayerTitle(playerName)}
				</p>
				<p className="mb-3 text-sm text-fg-muted">
					{EVENT_MATCH_REMOVE_PLAYER_LABEL.hint}
				</p>
				{errorMessage && (
					<p className={`mb-2 ${ERROR_CLASS}`}>{errorMessage}</p>
				)}
				<div className="mt-4 flex justify-end gap-2">
					<Button
						variant={BUTTON_VARIANT.secondary}
						onClick={onCancel}
						disabled={isPending}
					>
						{EVENT_MATCH_REMOVE_PLAYER_LABEL.cancel}
					</Button>
					<Button
						variant={BUTTON_VARIANT.danger}
						onClick={onConfirm}
						disabled={isPending}
					>
						{EVENT_ACTION.removePlayer}
					</Button>
				</div>
			</div>
		</AppDialog>
	);
}
