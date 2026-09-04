import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { DRAWER_CLOSE_LABEL } from "@/const/hammer-swipe";
import { useHammerVerticalSwipe } from "@/hooks/use-hammer-vertical-swipe";

type AppDrawerProps = {
	open: boolean;
	children: ReactNode;
	onClose: () => void;
};

const DRAWER_TRANSITION = {
	duration: 0.28,
	ease: [0.32, 0.72, 0, 1] as const,
};

function drawerPanelMotion(reduceMotion: boolean | null) {
	if (reduceMotion) {
		return {
			initial: { opacity: 0 },
			animate: { opacity: 1 },
			exit: { opacity: 0 },
		} as const;
	}

	return {
		initial: { y: "100%" },
		animate: { y: 0 },
		exit: { y: "100%" },
	} as const;
}

function drawerBackdropMotion() {
	return {
		initial: { opacity: 0 },
		animate: { opacity: 1 },
		exit: { opacity: 0 },
	} as const;
}

export function AppDrawer({ open, children, onClose }: AppDrawerProps) {
	const ref = useRef<HTMLDialogElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const [mounted, setMounted] = useState(open);
	const reduceMotion = useReducedMotion();
	const panelMotion = drawerPanelMotion(reduceMotion);
	const backdropMotion = drawerBackdropMotion();

	useHammerVerticalSwipe(
		panelRef,
		{
			onSwipeDown: onClose,
		},
		open,
	);

	useEffect(() => {
		if (!open) {
			return;
		}

		setMounted(true);
	}, [open]);

	useEffect(() => {
		const node = ref.current;
		if (!mounted || !node) {
			return;
		}

		if (!node.open) {
			node.showModal();
		}
	}, [mounted]);

	const handleExitComplete = useCallback(() => {
		if (open) {
			return;
		}

		const node = ref.current;
		if (node?.open) {
			node.close();
		}

		setMounted(false);
	}, [open]);

	function requestClose() {
		onClose();
	}

	if (!mounted) {
		return null;
	}

	return (
		<dialog
			ref={ref}
			className="m-0 flex h-dvh max-h-none w-full max-w-none items-end justify-center border-0 bg-transparent p-0"
			onCancel={(event) => {
				event.preventDefault();
				requestClose();
			}}
			onKeyDown={(event) => {
				if (event.key !== "Escape") {
					return;
				}

				event.preventDefault();
				requestClose();
			}}
		>
			<AnimatePresence onExitComplete={handleExitComplete}>
				{open && (
					<motion.button
						key="drawer-backdrop"
						type="button"
						aria-label={DRAWER_CLOSE_LABEL}
						className="absolute inset-0 border-0 bg-black/60 p-0"
						initial={backdropMotion.initial}
						animate={backdropMotion.animate}
						exit={backdropMotion.exit}
						transition={DRAWER_TRANSITION}
						onClick={requestClose}
					/>
				)}
				{open && (
					<motion.div
						key="drawer-panel"
						ref={panelRef}
						className="relative z-10 w-full touch-pan-y"
						initial={panelMotion.initial}
						animate={panelMotion.animate}
						exit={panelMotion.exit}
						transition={DRAWER_TRANSITION}
					>
						{children}
					</motion.div>
				)}
			</AnimatePresence>
		</dialog>
	);
}
