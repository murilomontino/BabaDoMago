import { Activity, type ReactNode } from "react";
import { TAB_PANEL, tabPanelMode } from "@/const/tabs";

type TabItem<Id extends string> = {
	id: Id;
	label: string;
};

type TabsProps<Id extends string> = {
	value: Id;
	items: readonly TabItem<Id>[];
	onChange: (id: Id) => void;
};

const TAB_BUTTON_TRANSITION =
	"transition-colors duration-200 ease-in-out motion-reduce:transition-none";

export function Tabs<Id extends string>({
	value,
	items,
	onChange,
}: TabsProps<Id>) {
	return (
		<div
			role="tablist"
			className="flex gap-1 overflow-x-auto border-b border-line"
		>
			{items.map((item) => {
				const isActive = item.id === value;

				return (
					<button
						key={item.id}
						type="button"
						role="tab"
						aria-selected={isActive}
						onClick={() => onChange(item.id)}
						className={
							isActive
								? `shrink-0 border-b-2 border-pitch-fg px-3 py-2 text-sm font-semibold tracking-tight text-pitch-fg ${TAB_BUTTON_TRANSITION}`
								: `shrink-0 border-b-2 border-transparent px-3 py-2 text-sm font-medium text-fg-muted hover:text-fg ${TAB_BUTTON_TRANSITION}`
						}
					>
						{item.label}
					</button>
				);
			})}
		</div>
	);
}

type TabPanelProps = {
	active: boolean;
	children: ReactNode;
};

export function TabPanel({ active, children }: TabPanelProps) {
	return (
		<Activity mode={tabPanelMode(active)}>
			<div className={TAB_PANEL.enter}>{children}</div>
		</Activity>
	);
}
