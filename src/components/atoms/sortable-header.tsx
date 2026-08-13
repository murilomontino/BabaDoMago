import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import type { ReactNode } from "react";

const ARIA_SORT = {
	asc: "ascending",
	desc: "descending",
	none: "none",
} as const;

type SortableHeaderProps = {
	children: ReactNode;
	canSort: boolean;
	sorted: false | "asc" | "desc";
	onSort?: (event: unknown) => void;
	align?: "left" | "right";
	title?: string;
};

export function SortableHeader({
	children,
	canSort,
	sorted,
	onSort,
	align = "left",
	title,
}: SortableHeaderProps) {
	const alignClass = align === "right" ? "text-right" : "text-left";
	const ariaSort = sorted ? ARIA_SORT[sorted] : ARIA_SORT.none;

	if (!canSort) {
		return (
			<th
				title={title}
				className={`whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wide text-stone-600 ${alignClass}`}
			>
				{children}
			</th>
		);
	}

	return (
		<th
			aria-sort={ariaSort}
			title={title}
			className={`whitespace-nowrap px-3 py-2 ${alignClass}`}
		>
			<button
				type="button"
				aria-label={title}
				onClick={(event) => {
					onSort?.(event);
				}}
				className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-stone-600 hover:text-stone-900 ${align === "right" ? "flex-row-reverse" : ""}`}
			>
				{children}
				{sorted === "asc" && <ChevronUp className="size-3.5 shrink-0" />}
				{sorted === "desc" && <ChevronDown className="size-3.5 shrink-0" />}
				{!sorted && <ChevronsUpDown className="size-3.5 shrink-0 opacity-40" />}
			</button>
		</th>
	);
}
