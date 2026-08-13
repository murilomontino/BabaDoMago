import { championshipLogoPublicUrl } from "@/services/championships";

type ChampionshipLogoProps = {
	path: string | null;
	name: string;
	className?: string;
};

export function ChampionshipLogo({
	path,
	name,
	className = "h-10 w-10 rounded-lg object-cover",
}: ChampionshipLogoProps) {
	if (!path) {
		return null;
	}

	return (
		<img
			src={championshipLogoPublicUrl(path)}
			alt={name}
			className={className}
		/>
	);
}
