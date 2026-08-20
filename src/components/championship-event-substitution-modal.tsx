import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import {
	EVENT_MATCH_SUBSTITUTION_LABEL,
	eventMatchSubstitutionTitle,
} from "@/const/championship-event-match";
import { BUTTON_VARIANT, ERROR_CLASS, MODAL_CLASS } from "@/const/ui";

type ChampionshipEventSubstitutionModalProps = {
	playerName: string;
	isPending?: boolean;
	errorMessage?: string | null;
	onCancel: () => void;
	onConfirm: (includeStats: boolean) => void;
};

export function ChampionshipEventSubstitutionModal({
	playerName,
	isPending = false,
	errorMessage = null,
	onCancel,
	onConfirm,
}: ChampionshipEventSubstitutionModalProps) {
	return (
		<AppDialog onClose={onCancel}>
			<div className={MODAL_CLASS}>
				<p className="mb-1 text-sm font-medium tracking-tight text-fg">
					{eventMatchSubstitutionTitle(playerName)}
				</p>
				<p className="mb-3 text-sm text-fg-muted">
					{EVENT_MATCH_SUBSTITUTION_LABEL.hint}
				</p>
				{errorMessage && (
					<p className={`mb-2 ${ERROR_CLASS}`}>{errorMessage}</p>
				)}
				<div className="mt-4 flex justify-end gap-2">
					<Button
						variant={BUTTON_VARIANT.secondary}
						onClick={() => {
							onConfirm(false);
						}}
						disabled={isPending}
					>
						{EVENT_MATCH_SUBSTITUTION_LABEL.skip}
					</Button>
					<Button
						onClick={() => {
							onConfirm(true);
						}}
						disabled={isPending}
					>
						{EVENT_MATCH_SUBSTITUTION_LABEL.count}
					</Button>
				</div>
			</div>
		</AppDialog>
	);
}
