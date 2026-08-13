import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import type { ReactNode } from "react";

const ARIA_SORT = {
	asc: "ascending",
	desc: "descending",
	none: "none",
} as const;

const HEADER_ALIGN_CLASS = {
	left: "text-left",
	center: "text-center",
	right: "text-right",
} as const;

const HEADER_SORT_BUTTON_CLASS = {
	left: "",
	center: "w-full justify-center",
	right: "flex-row-reverse",
} as const;

type SortableHeaderProps = {
	children: ReactNode;
	canSort: boolean;
	sorted: false | "asc" | "desc";
	onSort?: (event: unknown) => void;
	align?: "left" | "center" | "right";
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
	const alignClass = HEADER_ALIGN_CLASS[align];
	const ariaSort = sorted ? ARIA_SORT[sorted] : ARIA_SORT.none;

	if (!canSort) {
		return (
			<th
				title={title}
				className={`whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wide text-fg-muted ${alignClass}`}
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
				className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-fg-muted hover:text-fg ${HEADER_SORT_BUTTON_CLASS[align]}`}
			>
				{children}
				{sorted === "asc" && <ChevronUp className="size-3.5 shrink-0" />}
				{sorted === "desc" && <ChevronDown className="size-3.5 shrink-0" />}
				{!sorted && <ChevronsUpDown className="size-3.5 shrink-0 opacity-40" />}
			</button>
		</th>
	);
}
