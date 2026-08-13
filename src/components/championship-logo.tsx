import { Trophy } from "lucide-react";
import { championshipLogoPublicUrl } from "@/services/championships";

const LOGO_BOX =
	"relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg";

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
			className={`${LOGO_BOX} bg-pitch text-white ${className}`}
			role="img"
			aria-label={name}
		>
			<Trophy className="absolute size-[55%] opacity-25" aria-hidden />
			<span className="relative text-sm font-semibold">{initial}</span>
		</span>
	);
}
