import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import { EventTeamColorNoneButton } from "@/components/event-team-player";
import { EVENT_ACTION, EVENT_END_LABEL } from "@/const/championship-event";
import {
	EVENT_TEAM_COLOR,
	EVENT_TEAM_COLOR_CUSTOM_LABEL,
	EVENT_TEAM_COLOR_LABEL,
	EVENT_TEAM_COLORS,
	type EventTeamColor,
	eventTeamCustomColorPreview,
	isEventTeamColor,
	normalizeEventTeamColor,
} from "@/const/event-team-color";
import { BUTTON_VARIANT, ERROR_CLASS, MODAL_CLASS } from "@/const/ui";

type EventTeamColorModalProps = {
	color: EventTeamColor | null;
	usedColors: readonly EventTeamColor[];
	isPending: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onSelect: (color: EventTeamColor | null) => Promise<void>;
};

export function EventTeamColorModal({
	color,
	usedColors,
	isPending,
	errorMessage,
	onCancel,
	onSelect,
}: EventTeamColorModalProps) {
	const isCustom =
		color !== null && !EVENT_TEAM_COLORS.some((item) => item === color);

	function handleColorChange(nextValue: string | null) {
		if (isPending) {
			return;
		}

		if (nextValue === null) {
			void onSelect(null);
			return;
		}

		const next = normalizeEventTeamColor(nextValue);
		if (next === null || !isEventTeamColor(next)) {
			return;
		}

		if (usedColors.includes(next) && color !== next) {
			return;
		}

		void onSelect(next);
	}

	return (
		<AppDialog onClose={onCancel}>
			<div className={MODAL_CLASS}>
				<p className="mb-3 text-sm font-medium tracking-tight text-fg">
					{EVENT_ACTION.editTeamColor}
				</p>
				<div className="flex flex-wrap items-center gap-2">
					<EventTeamColorNoneButton
						selected={color === null}
						onSelect={() => handleColorChange(null)}
					/>
					{EVENT_TEAM_COLORS.map((item) => {
						const takenColor = usedColors.includes(item) && color !== item;
						const selected = color === item;

						return (
							<button
								key={item}
								type="button"
								disabled={takenColor || isPending}
								aria-label={EVENT_TEAM_COLOR_LABEL[item] ?? item}
								aria-pressed={selected}
								onClick={() => handleColorChange(item)}
								className={`size-8 rounded-md border-2 disabled:opacity-30 ${selected ? "border-current" : "border-black/20"}`}
								style={{ backgroundColor: item }}
							/>
						);
					})}
					<label className="relative size-8 shrink-0">
						<input
							type="color"
							value={color ?? EVENT_TEAM_COLOR.white}
							aria-label={EVENT_TEAM_COLOR_CUSTOM_LABEL}
							disabled={isPending}
							onChange={(event) => {
								handleColorChange(event.target.value);
							}}
							className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
						/>
						<span
							aria-hidden
							className={`block size-8 rounded-md border-2 ${isCustom ? "border-current" : "border-black/20"}`}
							style={eventTeamCustomColorPreview(isCustom, color)}
						/>
					</label>
				</div>
				{errorMessage && (
					<p className={`mt-2 ${ERROR_CLASS}`}>{errorMessage}</p>
				)}
				<div className="mt-4 flex justify-end">
					<Button
						variant={BUTTON_VARIANT.secondary}
						onClick={onCancel}
						disabled={isPending}
					>
						{EVENT_END_LABEL.cancel}
					</Button>
				</div>
			</div>
		</AppDialog>
	);
}
