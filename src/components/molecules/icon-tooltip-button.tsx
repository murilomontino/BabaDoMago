import type { ReactNode } from "react";
import { TOOLTIP_ID } from "@/const/tooltip";
import { BUTTON_VARIANT, type ButtonVariant } from "@/const/ui";

const ICON_TOOLTIP_BUTTON_BASE =
	"inline-flex items-center justify-center rounded-md transition disabled:opacity-50";

const ICON_TOOLTIP_BUTTON_ICON_ONLY = "size-6 p-0";

const ICON_TOOLTIP_BUTTON_WITH_LABEL =
	"size-6 p-0 sm:h-8 sm:w-auto sm:gap-1.5 sm:px-2.5 sm:text-xs sm:font-medium";

const ICON_TOOLTIP_BUTTON_TONE = {
	primary: "text-pitch-fg hover:bg-pitch-soft",
	secondary: "text-fg-muted hover:bg-surface-muted",
	danger: "text-danger-fg hover:bg-danger-soft",
	ghost: "text-fg-muted hover:bg-surface-muted",
} as const;

type IconTooltipButtonProps = {
	label: string;
	icon: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	variant?: ButtonVariant;
	type?: "button" | "submit";
	showLabel?: boolean;
};

export function IconTooltipButton({
	label,
	icon,
	onClick,
	disabled,
	variant = BUTTON_VARIANT.secondary,
	type = "button",
	showLabel = false,
}: IconTooltipButtonProps) {
	const sizeClass = showLabel
		? ICON_TOOLTIP_BUTTON_WITH_LABEL
		: ICON_TOOLTIP_BUTTON_ICON_ONLY;

	return (
		<button
			type={type}
			aria-label={label}
			data-tooltip-id={TOOLTIP_ID}
			data-tooltip-content={label}
			onClick={onClick}
			disabled={disabled}
			className={`${ICON_TOOLTIP_BUTTON_BASE} ${sizeClass} ${ICON_TOOLTIP_BUTTON_TONE[variant]}`}
		>
			{icon}
			{showLabel && <span className="hidden sm:inline">{label}</span>}
		</button>
	);
}
