import type { ReactNode } from "react";
import { TOOLTIP_ID } from "@/const/tooltip";
import { BUTTON_VARIANT, type ButtonVariant } from "@/const/ui";

const ICON_TOOLTIP_BUTTON_BASE =
	"inline-flex items-center justify-center rounded-md transition disabled:opacity-50";

const ICON_TOOLTIP_BUTTON_ICON_ONLY = "size-6 p-0";

const ICON_TOOLTIP_BUTTON_WITH_LABEL =
	"size-6 p-0 sm:h-8 sm:w-auto sm:gap-1.5 sm:px-2.5 sm:text-xs sm:font-medium";

const ICON_TOOLTIP_BUTTON_EXPAND_MOBILE =
	"h-10 w-full min-w-0 justify-center gap-1.5 px-2 text-xs font-medium md:h-6 md:w-6 md:gap-0 md:p-0";

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
	pressed?: boolean;
	variant?: ButtonVariant;
	type?: "button" | "submit";
	showLabel?: boolean;
	expandOnMobile?: boolean;
};

function iconTooltipButtonSizeClass(
	expandOnMobile: boolean,
	showLabel: boolean,
): string {
	if (expandOnMobile) {
		return ICON_TOOLTIP_BUTTON_EXPAND_MOBILE;
	}

	if (showLabel) {
		return ICON_TOOLTIP_BUTTON_WITH_LABEL;
	}

	return ICON_TOOLTIP_BUTTON_ICON_ONLY;
}

export function IconTooltipButton({
	label,
	icon,
	onClick,
	disabled,
	pressed,
	variant = BUTTON_VARIANT.secondary,
	type = "button",
	showLabel = false,
	expandOnMobile = false,
}: IconTooltipButtonProps) {
	const sizeClass = iconTooltipButtonSizeClass(expandOnMobile, showLabel);

	return (
		<button
			type={type}
			aria-label={label}
			data-tooltip-id={TOOLTIP_ID}
			data-tooltip-content={label}
			aria-pressed={pressed}
			onClick={onClick}
			disabled={disabled}
			className={`${ICON_TOOLTIP_BUTTON_BASE} ${sizeClass} ${ICON_TOOLTIP_BUTTON_TONE[variant]}`}
		>
			{icon}
			{expandOnMobile && <span className="truncate md:hidden">{label}</span>}
			{showLabel && <span className="hidden sm:inline">{label}</span>}
		</button>
	);
}
