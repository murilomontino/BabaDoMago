import { type ReactNode, useEffect, useRef } from "react";

type AppDialogProps = {
	children: ReactNode;
	onClose: () => void;
};

export function AppDialog({ children, onClose }: AppDialogProps) {
	const ref = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const node = ref.current;
		if (!node) {
			return;
		}

		if (!node.open) {
			node.showModal();
		}

		return () => {
			if (node.open) {
				node.close();
			}
		};
	}, []);

	return (
		<dialog
			ref={ref}
			className="m-0 flex h-dvh max-h-none w-full max-w-none items-center justify-center border-0 bg-transparent p-4 backdrop:bg-black/60"
			onCancel={(event) => {
				event.preventDefault();
				onClose();
			}}
			onKeyDown={(event) => {
				if (event.key !== "Escape") {
					return;
				}

				event.preventDefault();
				onClose();
			}}
			onClick={(event) => {
				if (event.target !== event.currentTarget) {
					return;
				}

				onClose();
			}}
		>
			{children}
		</dialog>
	);
}
