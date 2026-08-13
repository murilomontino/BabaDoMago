import { championshipLogoPublicUrl } from "@/services/championships";

const LOGO_BOX =
	"flex shrink-0 items-center justify-center overflow-hidden rounded-full";

type ChampionshipLogoProps = {
	path: string | null;
	name: string;
	className?: string;
};

export function ChampionshipLogo({
	path,
	name,
	className = "h-10 w-10",
}: ChampionshipLogoProps) {
	if (path) {
		return (
			<img
				src={championshipLogoPublicUrl(path)}
				alt={name}
				className={`${LOGO_BOX} object-cover ${className}`}
			/>
		);
	}

	const initial = name.trim().charAt(0).toUpperCase() || "?";

	return (
		<span
			className={`${LOGO_BOX} bg-pitch text-sm font-semibold text-white ${className}`}
			role="img"
			aria-label={name}
		>
			{initial}
		</span>
	);
}
