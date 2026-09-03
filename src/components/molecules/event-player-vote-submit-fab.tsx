import type { ReactNode } from "react";
import { Button } from "@/components/button";
import { BUTTON_VARIANT, CHIP_CLASS } from "@/const/ui";

const VOTE_SUBMIT_FAB_SAFE_CLASS =
	"pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]";

type EventPlayerVoteSubmitFabProps = {
	budgetLabel: string;
	disabled?: boolean;
	pending?: boolean;
	onClick: () => void;
	children: ReactNode;
};

export function EventPlayerVoteSubmitFab({
	budgetLabel,
	disabled,
	pending,
	onClick,
	children,
}: EventPlayerVoteSubmitFabProps) {
	return (
		<div className="pointer-events-none fixed inset-x-0 bottom-0 z-50">
			<div
				className={`pointer-events-auto mx-auto max-w-2xl border-t border-line bg-surface/95 px-5 pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.25)] backdrop-blur sm:px-6 ${VOTE_SUBMIT_FAB_SAFE_CLASS}`}
			>
				<div className="flex flex-col gap-2">
					<span className={`${CHIP_CLASS} self-start`} aria-live="polite">
						{budgetLabel}
					</span>
					<Button
						variant={BUTTON_VARIANT.primary}
						className="w-full shadow-md"
						disabled={disabled || pending}
						onClick={onClick}
					>
						{children}
					</Button>
				</div>
			</div>
		</div>
	);
}
