import type { ReactNode } from "react";
import { Button } from "@/components/button";
import { CHIP_CLASS } from "@/const/ui";

type AttendanceFloatingSaveProps = {
	selected: number;
	total: number;
	disabled?: boolean;
	type?: "button" | "submit";
	onClick?: () => void;
	children: ReactNode;
};

export function AttendanceFloatingSave({
	selected,
	total,
	disabled,
	type = "button",
	onClick,
	children,
}: AttendanceFloatingSaveProps) {
	return (
		<div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-1 md:hidden">
			<span className={CHIP_CLASS} aria-live="polite">
				{`${selected}/${total}`}
			</span>
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
