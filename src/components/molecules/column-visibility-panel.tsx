import { ChevronDown } from "lucide-react";
import { Switch } from "@/components/atoms/switch";

type ColumnVisibilityItem = {
	id: string;
	label: string;
	visible: boolean;
	onToggle: (visible: boolean) => void;
};

type ColumnVisibilityPanelProps = {
	items: readonly ColumnVisibilityItem[];
};

export function ColumnVisibilityPanel({ items }: ColumnVisibilityPanelProps) {
	if (items.length === 0) {
		return null;
	}

	return (
		<details className="group relative">
			<summary className="inline-flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-fg-muted hover:text-fg">
				Colunas
				<ChevronDown className="size-4 transition-transform group-open:rotate-180" />
			</summary>
			<div className="absolute z-10 mt-2 min-w-56 rounded-lg border border-line bg-surface p-3 shadow-sm">
				<ul className="space-y-2">
					{items.map((item) => {
						const switchId = `column-visibility-${item.id}`;

						return (
							<li key={item.id}>
								<div className="flex items-center justify-between gap-3 text-sm text-fg-muted">
									<label htmlFor={switchId}>{item.label}</label>
									<Switch
										id={switchId}
										checked={item.visible}
										onCheckedChange={item.onToggle}
									/>
								</div>
							</li>
						);
					})}
				</ul>
			</div>
		</details>
	);
}
