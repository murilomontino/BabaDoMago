type TabItem<Id extends string> = {
	id: Id;
	label: string;
};

type TabsProps<Id extends string> = {
	value: Id;
	items: readonly TabItem<Id>[];
	onChange: (id: Id) => void;
};

export function Tabs<Id extends string>({
	value,
	items,
	onChange,
}: TabsProps<Id>) {
	return (
		<div role="tablist" className="flex gap-1 border-b border-stone-200">
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
								? "border-b-2 border-pitch px-3 py-2 text-sm font-semibold tracking-tight text-pitch"
								: "border-b-2 border-transparent px-3 py-2 text-sm font-medium text-stone-600 hover:text-stone-900"
						}
					>
						{item.label}
					</button>
				);
			})}
		</div>
	);
}
