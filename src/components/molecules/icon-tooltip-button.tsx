import type { ReactNode } from "react";
import { TOOLTIP_ID } from "@/const/tooltip";
import {
	BUTTON_ICON_CLASS,
	BUTTON_VARIANT,
	type ButtonVariant,
	ICON_BUTTON_SIZE_CLASS,
} from "@/const/ui";

const ICON_TOOLTIP_BUTTON_BASE = `inline-flex items-center justify-center rounded-md transition disabled:opacity-50 ${BUTTON_ICON_CLASS}`;

const ICON_TOOLTIP_BUTTON_TONE: Record<ButtonVariant, string> = {
	primary: "text-pitch-fg hover:bg-pitch-soft",
	secondary: "text-fg-muted hover:bg-surface-muted",
	danger: "text-danger-fg hover:bg-danger-soft",
	ghost: "text-fg-muted hover:bg-surface-muted",
	soft: "text-info-fg hover:bg-info-soft",
	muted: "text-fg-muted hover:bg-surface-muted",
};

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
		return ICON_BUTTON_SIZE_CLASS.expandOnMobile;
	}

	if (showLabel) {
		return ICON_BUTTON_SIZE_CLASS.withLabel;
	}

	return ICON_BUTTON_SIZE_CLASS.iconOnly;
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
			{showLabel && <span className="min-w-0 truncate">{label}</span>}
		</button>
	);
}
