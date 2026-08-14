import type { ReactNode } from "react";
import { TOOLTIP_ID } from "@/const/tooltip";
import { BUTTON_VARIANT, type ButtonVariant } from "@/const/ui";

const ICON_TOOLTIP_BUTTON_BASE =
	"inline-flex size-6 items-center justify-center rounded-md p-0 transition disabled:opacity-50";

const ICON_TOOLTIP_BUTTON_CLASS = {
	primary: `${ICON_TOOLTIP_BUTTON_BASE} text-pitch-fg hover:bg-pitch-soft`,
	secondary: `${ICON_TOOLTIP_BUTTON_BASE} text-fg-muted hover:bg-surface-muted`,
	danger: `${ICON_TOOLTIP_BUTTON_BASE} text-danger-fg hover:bg-danger-soft`,
	ghost: `${ICON_TOOLTIP_BUTTON_BASE} text-fg-muted hover:bg-surface-muted`,
} as const;

type IconTooltipButtonProps = {
	label: string;
	icon: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	variant?: ButtonVariant;
	type?: "button" | "submit";
};

export function IconTooltipButton({
	label,
	icon,
	onClick,
	disabled,
	variant = BUTTON_VARIANT.secondary,
	type = "button",
}: IconTooltipButtonProps) {
	return (
		<button
			type={type}
			aria-label={label}
			data-tooltip-id={TOOLTIP_ID}
			data-tooltip-content={label}
			onClick={onClick}
			disabled={disabled}
			className={ICON_TOOLTIP_BUTTON_CLASS[variant]}
		>
			{icon}
		</button>
	);
}
