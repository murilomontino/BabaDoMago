type TableLegendItem = {
	abbr: string;
	label: string;
};

type TableLegendProps = {
	items: readonly TableLegendItem[];
};

export function TableLegend({ items }: TableLegendProps) {
	if (items.length === 0) {
		return null;
	}

	return (
		<ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-muted">
			{items.map((item) => (
				<li key={item.abbr}>
					<span className="font-semibold text-fg">{item.abbr}</span>
					{" = "}
					{item.label}
				</li>
			))}
		</ul>
	);
}
