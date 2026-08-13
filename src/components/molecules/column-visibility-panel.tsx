type ColumnVisibilityItem = {
	id: string;
	label: string;
	visible: boolean;
	onToggle: (event: unknown) => void;
};

type ColumnVisibilityPanelProps = {
	items: readonly ColumnVisibilityItem[];
};

export function ColumnVisibilityPanel({ items }: ColumnVisibilityPanelProps) {
	if (items.length === 0) {
		return null;
	}

	return (
		<details className="relative mb-3">
			<summary className="cursor-pointer list-none text-sm font-medium text-stone-700 hover:text-stone-900">
				Colunas
			</summary>
			<div className="absolute z-10 mt-2 min-w-56 rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
				<ul className="space-y-2">
					{items.map((item) => (
						<li key={item.id}>
							<label className="flex items-center gap-2 text-sm text-stone-700">
								<input
									type="checkbox"
									checked={item.visible}
									onChange={item.onToggle}
									className="accent-pitch"
								/>
								{item.label}
							</label>
						</li>
					))}
				</ul>
			</div>
		</details>
	);
}
