import { useState } from "react";
import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { EVENT_MVP_LABEL, toggleEventMvpPlayerId } from "@/const/event-mvp";
import { BUTTON_VARIANT, CHIP_CLASS, ERROR_CLASS } from "@/const/ui";

type SetEventMvpPlayer = {
	id: number;
	name: string;
};

type SetEventMvpModalProps = {
	players: readonly SetEventMvpPlayer[];
	initialPlayerIds: readonly number[];
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onSave: (playerIds: number[]) => Promise<void>;
};

export function SetEventMvpModal({
	players,
	initialPlayerIds,
	isPending,
	errorMessage,
	onCancel,
	onSave,
}: SetEventMvpModalProps) {
	const [selectedIds, setSelectedIds] = useState(() => [...initialPlayerIds]);

	return (
		<AppDialog onClose={onCancel}>
			<div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl bg-surface p-4 shadow-lg">
				<p className="mb-1 text-sm font-medium tracking-tight text-fg">
					{EVENT_MVP_LABEL.title}
				</p>
				<p className="mb-3 text-sm text-fg-muted">{EVENT_MVP_LABEL.hint}</p>
				{players.length === 0 && (
					<p className="mb-3 text-sm text-fg-muted">{EVENT_MVP_LABEL.empty}</p>
				)}
				{players.length > 0 && (
					<ul className="mb-3 divide-y divide-line">
						{players.map((player) => {
							const selected = selectedIds.includes(player.id);

							return (
								<li key={player.id} className="py-1 first:pt-0 last:pb-0">
									<button
										type="button"
										className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-surface-muted"
										disabled={isPending}
										onClick={() => {
											setSelectedIds((current) =>
												toggleEventMvpPlayerId(current, player.id),
											);
										}}
									>
										<span className="truncate font-medium text-fg">
											{player.name}
										</span>
										{selected && (
											<span className={CHIP_CLASS}>
												{EVENT_MVP_LABEL.badge}
											</span>
										)}
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
						{EVENT_MVP_LABEL.cancel}
					</Button>
					<Button
						onClick={() => {
							void onSave(selectedIds);
						}}
						disabled={isPending}
					>
						{EVENT_MVP_LABEL.save}
					</Button>
				</div>
			</div>
		</AppDialog>
	);
}
