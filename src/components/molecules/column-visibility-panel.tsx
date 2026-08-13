import { ChevronDown } from "lucide-react";

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
		<details className="group relative mb-3">
			<summary className="inline-flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-fg-muted hover:text-fg">
				Colunas
				<ChevronDown className="size-4 transition-transform group-open:rotate-180" />
			</summary>
			<div className="absolute z-10 mt-2 min-w-56 rounded-lg border border-line bg-surface p-3 shadow-sm">
				<ul className="space-y-2">
					{items.map((item) => (
						<li key={item.id}>
							<label className="flex items-center gap-2 text-sm text-fg-muted">
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
