import { Root, Thumb } from "@radix-ui/react-switch";

const SWITCH_TRANSITION = "duration-300 ease-out motion-reduce:transition-none";

const SWITCH_ROOT_CLASS = `inline-flex h-6 w-10 shrink-0 items-center overflow-hidden rounded-full border border-line transition-[background-color,border-color] ${SWITCH_TRANSITION} focus:outline-none focus:ring-2 focus:ring-pitch/20 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-pitch data-[state=checked]:bg-pitch data-[state=unchecked]:bg-surface-muted`;

const SWITCH_THUMB_CLASS = `pointer-events-none block size-5 shrink-0 rounded-full bg-white shadow-sm transition-transform ${SWITCH_TRANSITION} data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5`;

type SwitchProps = {
	id: string;
	checked: boolean;
	disabled?: boolean;
	onCheckedChange: (checked: boolean) => void;
};

export function Switch({
	id,
	checked,
	disabled,
	onCheckedChange,
}: SwitchProps) {
	return (
		<Root
			id={id}
			checked={checked}
			disabled={disabled}
			onCheckedChange={onCheckedChange}
			className={SWITCH_ROOT_CLASS}
		>
			<Thumb className={SWITCH_THUMB_CLASS} />
		</Root>
	);
}
