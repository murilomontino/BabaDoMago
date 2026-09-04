import { useEffect, useRef, useState } from "react";
import { AppDrawer } from "@/components/atoms/app-drawer";
import { Button } from "@/components/button";
import { Tabs } from "@/components/tabs";
import {
	CHAMPIONSHIP_PRIMARY_TABS,
	CHAMPIONSHIP_TAB,
	CHAMPIONSHIP_TAB_LABEL,
	CHAMPIONSHIP_TABS_DESKTOP_MEDIA,
	type ChampionshipTab,
	championshipMoreTabs,
	championshipTabs,
	isChampionshipMoreTab,
} from "@/const/championship-tab";
import { BUTTON_VARIANT, DRAWER_CLASS } from "@/const/ui";
import { useHammerVerticalSwipe } from "@/hooks/use-hammer-vertical-swipe";
import { useMediaQuery } from "@/hooks/use-media-query";

type ChampionshipTabsProps = {
	value: ChampionshipTab;
	includeManagement: boolean;
	onChange: (id: ChampionshipTab) => void;
};

const TAB_BUTTON_TRANSITION =
	"transition-colors duration-200 ease-in-out motion-reduce:transition-none";

function tabButtonClass(isActive: boolean) {
	if (isActive) {
		return `shrink-0 border-b-2 border-pitch-fg px-3 py-2 text-sm font-semibold tracking-tight text-pitch-fg ${TAB_BUTTON_TRANSITION}`;
	}

	return `shrink-0 border-b-2 border-transparent px-3 py-2 text-sm font-medium text-fg-muted hover:text-fg ${TAB_BUTTON_TRANSITION}`;
}

function moreDrawerItemClass(isActive: boolean) {
	if (isActive) {
		return "w-full justify-start font-semibold";
	}

	return "w-full justify-start";
}

function moreDrawerItemVariant(isActive: boolean) {
	if (isActive) {
		return BUTTON_VARIANT.soft;
	}

	return BUTTON_VARIANT.secondary;
}

function ariaCurrentWhenActive(isActive: boolean) {
	if (!isActive) {
		return undefined;
	}

	return true as const;
}

export function ChampionshipTabs({
	value,
	includeManagement,
	onChange,
}: ChampionshipTabsProps) {
	const isDesktop = useMediaQuery(CHAMPIONSHIP_TABS_DESKTOP_MEDIA);
	const [isMoreOpen, setIsMoreOpen] = useState(false);
	const tabListRef = useRef<HTMLDivElement>(null);
	const moreActive = isChampionshipMoreTab(value, includeManagement);
	const moreItems = championshipMoreTabs(includeManagement);
	const allItems = championshipTabs(includeManagement);

	useEffect(() => {
		if (!isDesktop) {
			return;
		}

		setIsMoreOpen(false);
	}, [isDesktop]);

	useHammerVerticalSwipe(
		tabListRef,
		{
			onSwipeUp: () => {
				setIsMoreOpen(true);
			},
		},
		!isDesktop && !isMoreOpen,
	);

	if (isDesktop) {
		return <Tabs value={value} items={allItems} onChange={onChange} />;
	}

	function handlePrimaryChange(id: ChampionshipTab) {
		onChange(id);
	}

	function handleMoreOpen() {
		setIsMoreOpen(true);
	}

	function handleMoreClose() {
		setIsMoreOpen(false);
	}

	function handleMoreSelect(id: ChampionshipTab) {
		onChange(id);
		setIsMoreOpen(false);
	}

	return (
		<>
			<div
				ref={tabListRef}
				role="tablist"
				className="flex touch-pan-y gap-1 overflow-x-auto border-b border-line"
			>
				{CHAMPIONSHIP_PRIMARY_TABS.map((item) => {
					const isActive = item.id === value;

					return (
						<button
							key={item.id}
							type="button"
							role="tab"
							aria-selected={isActive}
							onClick={() => {
								handlePrimaryChange(item.id);
							}}
							className={tabButtonClass(isActive)}
						>
							{item.label}
						</button>
					);
				})}
				<button
					type="button"
					role="tab"
					aria-selected={moreActive}
					aria-haspopup="dialog"
					aria-expanded={isMoreOpen}
					onClick={handleMoreOpen}
					className={tabButtonClass(moreActive)}
				>
					{CHAMPIONSHIP_TAB_LABEL.more}
				</button>
			</div>
			<AppDrawer open={isMoreOpen} onClose={handleMoreClose}>
				<div className={DRAWER_CLASS}>
					<div
						className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-fg-subtle"
						aria-hidden
					/>
					<p className="mb-3 text-sm font-medium tracking-tight text-fg">
						{CHAMPIONSHIP_TAB_LABEL.more}
					</p>
					<div className="flex flex-col gap-2">
						{moreItems.map((item) => {
							const isActive = item.id === value;

							return (
								<Button
									key={item.id}
									variant={moreDrawerItemVariant(isActive)}
									className={moreDrawerItemClass(isActive)}
									aria-current={ariaCurrentWhenActive(isActive)}
									onClick={() => {
										handleMoreSelect(item.id);
									}}
								>
									{item.label}
								</Button>
							);
						})}
					</div>
				</div>
			</AppDrawer>
		</>
	);
}

export function ChampionshipTabsSkeleton() {
	return (
		<>
			<div
				role="tablist"
				className="flex gap-1 overflow-x-auto border-b border-line md:hidden"
			>
				{CHAMPIONSHIP_PRIMARY_TABS.map((item) => {
					const isActive = item.id === CHAMPIONSHIP_TAB.roster;

					return (
						<button
							key={item.id}
							type="button"
							role="tab"
							aria-selected={isActive}
							disabled
							className={tabButtonClass(isActive)}
						>
							{item.label}
						</button>
					);
				})}
				<button
					type="button"
					role="tab"
					aria-selected={false}
					disabled
					className={tabButtonClass(false)}
				>
					{CHAMPIONSHIP_TAB_LABEL.more}
				</button>
			</div>
			<div className="hidden md:block">
				<Tabs
					value={CHAMPIONSHIP_TAB.roster}
					items={championshipTabs(false)}
					onChange={ignoreTabChange}
				/>
			</div>
		</>
	);
}

function ignoreTabChange() {
	return;
}
