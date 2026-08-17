import { MapPin, Settings, Shield } from "lucide-react";
import type { FormEvent } from "react";
import { ChampionshipLogo } from "@/components/championship-logo";
import { IconTooltipButton } from "@/components/molecules/icon-tooltip-button";
import {
	formatChampionshipSchedule,
	parseEventWeekday,
} from "@/const/championship-event";
import { CHAMPIONSHIP_LOGO } from "@/const/championship-logo";
import { CHAMPIONSHIP_TAB_LABEL } from "@/const/championship-tab";
import { BUTTON_VARIANT, CARD_CLASS, ERROR_CLASS } from "@/const/ui";

type ChampionshipDetailHeaderProps = {
	name: string;
	logoPath: string | null;
	eventWeekday: number | null;
	eventTime: string;
	location: string | null;
	roleLabel: string;
	isOwner: boolean;
	isUploading: boolean;
	logoSourceError: string | null;
	uploadError: string | null;
	canOpenSettings: boolean;
	isSettingsOpen: boolean;
	onLogoChange: (event: FormEvent<HTMLInputElement>) => void;
	onToggleSettings: () => void;
};

export function ChampionshipDetailHeader({
	name,
	logoPath,
	eventWeekday,
	eventTime,
	location,
	roleLabel,
	isOwner,
	isUploading,
	logoSourceError,
	uploadError,
	canOpenSettings,
	isSettingsOpen,
	onLogoChange,
	onToggleSettings,
}: ChampionshipDetailHeaderProps) {
	const scheduleLine = formatChampionshipSchedule({
		weekday: parseEventWeekday(eventWeekday),
		eventTime,
		location,
	});

	return (
		<section className={CARD_CLASS}>
			<div className="flex items-start gap-4">
				{isOwner && (
					<label
						className="cursor-pointer"
						aria-label={logoPath ? "Trocar logo" : "Enviar logo"}
					>
						<ChampionshipLogo
							path={logoPath}
							name={name}
							className="h-16 w-16"
						/>
						<input
							type="file"
							accept={`${CHAMPIONSHIP_LOGO.mimePng},${CHAMPIONSHIP_LOGO.mimeJpeg}`}
							disabled={isUploading}
							onChange={onLogoChange}
							className="sr-only"
						/>
					</label>
				)}
				{!isOwner && (
					<ChampionshipLogo path={logoPath} name={name} className="h-16 w-16" />
				)}
				<div className="min-w-0 flex-1">
					<h1 className="text-2xl font-semibold tracking-tight text-fg">
						{name}
					</h1>
					{scheduleLine && (
						<p className="mt-1 flex items-start gap-1.5 text-sm text-fg-muted">
							{location && <MapPin className="mt-0.5 size-3.5 shrink-0" />}
							<span>{scheduleLine}</span>
						</p>
					)}
					<span className="mt-2 inline-flex items-center gap-1 rounded-full bg-pitch-soft px-2 py-0.5 text-xs font-medium text-pitch-fg">
						<Shield className="size-3" />
						{roleLabel}
					</span>
				</div>
				{canOpenSettings && (
					<IconTooltipButton
						label={CHAMPIONSHIP_TAB_LABEL.settings}
						icon={<Settings className="size-4" />}
						pressed={isSettingsOpen}
						variant={
							isSettingsOpen ? BUTTON_VARIANT.primary : BUTTON_VARIANT.secondary
						}
						onClick={onToggleSettings}
					/>
				)}
			</div>
			{logoSourceError && (
				<p className={`mt-3 ${ERROR_CLASS}`}>{logoSourceError}</p>
			)}
			{uploadError && <p className={`mt-3 ${ERROR_CLASS}`}>{uploadError}</p>}
		</section>
	);
}
