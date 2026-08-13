import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { EVENT_ACTION } from "@/const/championship-event";
import {
	EVENT_GOAL_KIND,
	EVENT_GOAL_LABEL,
	type EventGoalKind,
} from "@/const/championship-event-match";
import { BUTTON_VARIANT, ERROR_CLASS, MODAL_CLASS } from "@/const/ui";

type GoalCandidate = {
	playerId: number;
	name: string;
};

type ChampionshipEventGoalModalProps = {
	scorerName: string;
	candidates: readonly GoalCandidate[];
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onConfirm: (values: {
		kind: EventGoalKind;
		assistPlayerId: number | null;
	}) => Promise<void>;
};

export function ChampionshipEventGoalModal({
	scorerName,
	candidates,
	isPending,
	errorMessage,
	onCancel,
	onConfirm,
}: ChampionshipEventGoalModalProps) {
	return (
		<AppDialog onClose={onCancel}>
			<div className={MODAL_CLASS}>
				<p className="mb-1 text-sm font-medium tracking-tight text-fg">
					{EVENT_ACTION.markGoal}
				</p>
				<p className="mb-3 text-sm text-fg-muted">{scorerName}</p>
				<ul className="space-y-1">
					{candidates.map((candidate) => (
						<li key={candidate.playerId}>
							<Button
								variant={BUTTON_VARIANT.secondary}
								className="w-full justify-start"
								disabled={isPending}
								onClick={() => {
									void onConfirm({
										kind: EVENT_GOAL_KIND.assist,
										assistPlayerId: candidate.playerId,
									});
								}}
							>
								{candidate.name}
							</Button>
						</li>
					))}
					<li>
						<Button
							variant={BUTTON_VARIANT.secondary}
							className="w-full justify-start"
							disabled={isPending}
							onClick={() => {
								void onConfirm({
									kind: EVENT_GOAL_KIND.none,
									assistPlayerId: null,
								});
							}}
						>
							{EVENT_GOAL_LABEL.none}
						</Button>
					</li>
					<li>
						<Button
							variant={BUTTON_VARIANT.ghost}
							className="w-full justify-start"
							disabled={isPending}
							onClick={() => {
								void onConfirm({
									kind: EVENT_GOAL_KIND.ownGoal,
									assistPlayerId: null,
								});
							}}
						>
							{EVENT_GOAL_LABEL.ownGoal}
						</Button>
					</li>
				</ul>
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
