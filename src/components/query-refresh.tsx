import type { QueryKey } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { IconTooltipButton } from "@/components/molecules/icon-tooltip-button";
import {
	listingScrollY,
	pullDeltaFromTouch,
	QUERY_REFRESH,
	QUERY_REFRESH_LABEL,
	queryRefreshPullOffset,
	shouldCommitQueryRefresh,
} from "@/const/query-refresh";
import { BUTTON_VARIANT } from "@/const/ui";
import {
	useQueryRefresh,
	useQueryRefreshDesktop,
} from "@/hooks/use-query-refresh";

export function QueryRefreshButton({ queryKey }: { queryKey: QueryKey }) {
	const isDesktop = useQueryRefreshDesktop();
	const { refresh, isRefreshing } = useQueryRefresh(queryKey);

	if (!isDesktop) {
		return null;
	}

	return (
		<IconTooltipButton
			label={QUERY_REFRESH_LABEL.action}
			icon={<RefreshCw className={refreshIconClass(isRefreshing)} />}
			variant={BUTTON_VARIANT.ghost}
			disabled={isRefreshing}
			onClick={() => {
				void refresh();
			}}
		/>
	);
}

export function QueryRefresh({
	queryKey,
	children,
}: {
	queryKey: QueryKey;
	children: ReactNode;
}) {
	const isDesktop = useQueryRefreshDesktop();

	if (isDesktop) {
		return children;
	}

	return <QueryRefreshPull queryKey={queryKey}>{children}</QueryRefreshPull>;
}

function refreshIconClass(isRefreshing: boolean): string {
	if (!isRefreshing) {
		return "size-4";
	}

	return "size-4 animate-spin";
}

function pullRefreshIconClass(pending: boolean): string {
	if (!pending) {
		return "size-5 text-pitch";
	}

	return "size-5 animate-spin text-pitch";
}

function QueryRefreshPull({
	queryKey,
	children,
}: {
	queryKey: QueryKey;
	children: ReactNode;
}) {
	const { refresh } = useQueryRefresh(queryKey);
	const rootRef = useRef<HTMLDivElement>(null);
	const startYRef = useRef<number | null>(null);
	const pullPxRef = useRef(0);
	const [pullPx, setPullPx] = useState(0);
	const [pending, setPending] = useState(false);

	const setPull = useCallback((next: number) => {
		pullPxRef.current = next;
		setPullPx(next);
	}, []);

	useEffect(() => {
		const listing = rootRef.current;
		if (!listing) {
			return;
		}

		function onTouchStart(event: TouchEvent) {
			const touch = event.touches[0];
			if (!touch) {
				return;
			}

			const target = event.currentTarget;
			if (!(target instanceof HTMLElement)) {
				return;
			}

			const scrollY = listingScrollY(window.scrollY, target.scrollTop);
			if (scrollY > 0) {
				startYRef.current = null;
				return;
			}

			startYRef.current = touch.clientY;
		}

		function onTouchMove(event: TouchEvent) {
			const startY = startYRef.current;
			if (startY == null) {
				return;
			}

			const touch = event.touches[0];
			if (!touch) {
				return;
			}

			const target = event.currentTarget;
			if (!(target instanceof HTMLElement)) {
				return;
			}

			const delta = pullDeltaFromTouch(
				listingScrollY(window.scrollY, target.scrollTop),
				startY,
				touch.clientY,
			);
			if (delta <= 0) {
				setPull(0);
				return;
			}

			event.preventDefault();
			setPull(delta);
		}

		function onTouchEnd() {
			const distance = pullPxRef.current;
			startYRef.current = null;
			setPull(0);

			if (!shouldCommitQueryRefresh(distance, QUERY_REFRESH.pullThresholdPx)) {
				return;
			}

			setPending(true);
			void refresh().finally(() => {
				setPending(false);
			});
		}

		listing.addEventListener("touchstart", onTouchStart, { passive: true });
		listing.addEventListener("touchmove", onTouchMove, { passive: false });
		listing.addEventListener("touchend", onTouchEnd);
		listing.addEventListener("touchcancel", onTouchEnd);

		return () => {
			listing.removeEventListener("touchstart", onTouchStart);
			listing.removeEventListener("touchmove", onTouchMove);
			listing.removeEventListener("touchend", onTouchEnd);
			listing.removeEventListener("touchcancel", onTouchEnd);
		};
	}, [refresh, setPull]);

	const offset = queryRefreshPullOffset(
		pullPx,
		pending,
		QUERY_REFRESH.pullThresholdPx,
	);

	return (
		<div ref={rootRef} className="relative overscroll-y-contain">
			{offset > 0 && (
				<div
					className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center"
					aria-live="polite"
					role="status"
				>
					<span className="sr-only">{QUERY_REFRESH_LABEL.action}</span>
					<RefreshCw
						className={pullRefreshIconClass(pending)}
						style={{ transform: `translateY(${offset}px)` }}
						aria-hidden
					/>
				</div>
			)}
			{children}
		</div>
	);
}
