import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { playerVisibleName } from "@/const/player-name";
import { BUTTON_VARIANT, ERROR_CLASS, MODAL_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

type ChampionshipEventBenchModalProps = {
	title: string;
	players: readonly ChampionshipPlayer[];
	emptyMessage?: string;
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onSelect: (playerId: number) => Promise<void>;
};

export function ChampionshipEventBenchModal({
	title,
	players,
	emptyMessage = "Ninguém no banco.",
	isPending,
	errorMessage,
	onCancel,
	onSelect,
}: ChampionshipEventBenchModalProps) {
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
					<ul className="max-h-72 space-y-1 overflow-y-auto">
						{players.map((player) => (
							<li key={player.id}>
								<Button
									variant={BUTTON_VARIANT.secondary}
									className="w-full justify-start"
									disabled={isPending}
									onClick={() => {
										void onSelect(player.id);
									}}
								>
									{playerVisibleName(player)}
								</Button>
							</li>
						))}
					</ul>
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
