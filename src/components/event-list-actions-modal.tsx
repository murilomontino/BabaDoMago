import { AppDialog } from "@/components/atoms/app-dialog";
import { Button } from "@/components/button";
import {
	EVENT_ACTION,
	EVENT_LIST_ACTIONS_LABEL,
} from "@/const/championship-event";
import { BUTTON_VARIANT, MODAL_CLASS } from "@/const/ui";

type EventListActionsModalProps = {
	title: string;
	copyMatchLinkLabel: string;
	continueMatch: boolean;
	showStartMatch: boolean;
	canEnd: boolean;
	canSetMvp: boolean;
	canDelete: boolean;
	onCopyLink: () => void;
	onOpenPlay: () => void;
	onEnd: () => void;
	onSetMvp: () => void;
	onDelete: () => void;
	onClose: () => void;
};

export function EventListActionsModal({
	title,
	copyMatchLinkLabel,
	continueMatch,
	showStartMatch,
	canEnd,
	canSetMvp,
	canDelete,
	onCopyLink,
	onOpenPlay,
	onEnd,
	onSetMvp,
	onDelete,
	onClose,
}: EventListActionsModalProps) {
	return (
		<AppDialog onClose={onClose}>
			<div className={MODAL_CLASS}>
				<p className="mb-3 text-sm font-medium tracking-tight text-fg">
					{title}
				</p>
				<div className="flex flex-col gap-2">
					{showStartMatch && (
						<Button
							variant={BUTTON_VARIANT.secondary}
							className="w-full"
							onClick={onCopyLink}
						>
							{copyMatchLinkLabel}
						</Button>
					)}
					{showStartMatch && continueMatch && (
						<Button className="w-full" onClick={onOpenPlay}>
							{EVENT_ACTION.continueMatch}
						</Button>
					)}
					{showStartMatch && !continueMatch && (
						<Button className="w-full" onClick={onOpenPlay}>
							{EVENT_ACTION.startMatch}
						</Button>
					)}
					{canEnd && (
						<Button
							variant={BUTTON_VARIANT.secondary}
							className="w-full"
							onClick={onEnd}
						>
							{EVENT_ACTION.endEvent}
						</Button>
					)}
					{canSetMvp && (
						<Button
							variant={BUTTON_VARIANT.secondary}
							className="w-full"
							onClick={onSetMvp}
						>
							{EVENT_ACTION.setMvp}
						</Button>
					)}
					{canDelete && (
						<Button
							variant={BUTTON_VARIANT.danger}
							className="w-full"
							onClick={onDelete}
						>
							{EVENT_ACTION.deleteEvent}
						</Button>
					)}
					<Button
						variant={BUTTON_VARIANT.ghost}
						className="w-full"
						onClick={onClose}
					>
						{EVENT_LIST_ACTIONS_LABEL.cancel}
					</Button>
				</div>
			</div>
		</AppDialog>
	);
}
