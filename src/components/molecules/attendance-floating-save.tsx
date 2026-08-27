import type { ReactNode } from "react";
import { Button } from "@/components/button";
import { CHIP_CLASS, SAFE_AREA_FAB_CLASS } from "@/const/ui";

type AttendanceFloatingSaveProps = {
	selected: number;
	total: number;
	disabled?: boolean;
	type?: "button" | "submit";
	onClick?: () => void;
	secondary?: ReactNode;
	children: ReactNode;
};

export function AttendanceFloatingSave({
	selected,
	total,
	disabled,
	type = "button",
	onClick,
	secondary,
	children,
}: AttendanceFloatingSaveProps) {
	return (
		<div
			className={`fixed z-50 flex flex-col items-end gap-1 md:hidden ${SAFE_AREA_FAB_CLASS}`}
		>
			<span className={CHIP_CLASS} aria-live="polite">
				{`${selected}/${total}`}
			</span>
			{secondary}
			<Button
				type={type}
				disabled={disabled}
				onClick={onClick}
				className="shadow-md"
			>
				{children}
			</Button>
		</div>
	);
}
