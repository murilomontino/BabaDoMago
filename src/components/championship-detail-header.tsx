import { Shield } from "lucide-react";
import type { FormEvent } from "react";
import { ChampionshipLogo } from "@/components/championship-logo";
import { CHAMPIONSHIP_LOGO } from "@/const/championship-logo";
import { CARD_CLASS, ERROR_CLASS } from "@/const/ui";

type ChampionshipDetailHeaderProps = {
	name: string;
	logoPath: string | null;
	roleLabel: string;
	isOwner: boolean;
	isUploading: boolean;
	logoSourceError: string | null;
	uploadError: string | null;
	onLogoChange: (event: FormEvent<HTMLInputElement>) => void;
};

export function ChampionshipDetailHeader({
	name,
	logoPath,
	roleLabel,
	isOwner,
	isUploading,
	logoSourceError,
	uploadError,
	onLogoChange,
}: ChampionshipDetailHeaderProps) {
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
					<span className="mt-2 inline-flex items-center gap-1 rounded-full bg-pitch-soft px-2 py-0.5 text-xs font-medium text-pitch-fg">
						<Shield className="size-3" />
						{roleLabel}
					</span>
				</div>
			</div>
			{logoSourceError && (
				<p className={`mt-3 ${ERROR_CLASS}`}>{logoSourceError}</p>
			)}
			{uploadError && <p className={`mt-3 ${ERROR_CLASS}`}>{uploadError}</p>}
		</section>
	);
}
