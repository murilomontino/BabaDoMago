import { UserX } from "lucide-react";
import { ChampionshipRoster } from "@/components/championship-roster";
import { SectionCard } from "@/components/section-card";
import { ERROR_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

type ChampionshipDeactivatedTabProps = {
	players: ChampionshipPlayer[];
	createdBy: string;
	currentUserId: string | null;
	reactivatingPlayerId: number | null;
	reactivateError: string | null;
	onReactivate: (playerId: number) => void;
};

export function ChampionshipDeactivatedTab({
	players,
	createdBy,
	currentUserId,
	reactivatingPlayerId,
	reactivateError,
	onReactivate,
}: ChampionshipDeactivatedTabProps) {
	return (
		<SectionCard
			title="Desativados"
			icon={<UserX className="size-4 text-pitch-fg" />}
		>
			<ChampionshipRoster
				players={players}
				createdBy={createdBy}
				currentUserId={currentUserId}
				onReactivate={onReactivate}
				reactivatingPlayerId={reactivatingPlayerId}
				emptyTitle="Nenhum jogador desativado"
				withStats={false}
			/>
			{reactivateError && (
				<p className={`mt-4 ${ERROR_CLASS}`}>{reactivateError}</p>
			)}
		</SectionCard>
	);
}
