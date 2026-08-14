import { User, X } from "lucide-react";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import {
	EVENT_GOAL_KIND,
	EVENT_GOAL_LABEL,
	type EventGoalKind,
	eventGoalScorerHint,
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
				<h2 className="mb-1 text-lg font-semibold tracking-tight text-fg">
					{EVENT_GOAL_LABEL.whoAssisted}
				</h2>
				<p className="mb-3 text-sm text-fg-muted">
					{eventGoalScorerHint(scorerName)}
				</p>
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
								<User className="size-4 shrink-0" size={16} />
								{candidate.name}
							</Button>
						</li>
					))}
					<li>
						<Button
							variant={BUTTON_VARIANT.danger}
							className="w-full justify-start"
							disabled={isPending}
							onClick={() => {
								void onConfirm({
									kind: EVENT_GOAL_KIND.none,
									assistPlayerId: null,
								});
							}}
						>
							<X
								className="size-4 shrink-0"
								size={16}
								color="var(--color-danger-fg)"
								strokeWidth={2.5}
							/>
							{EVENT_GOAL_LABEL.none}
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
