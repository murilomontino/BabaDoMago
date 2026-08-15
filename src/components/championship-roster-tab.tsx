import { Field, Form, Formik } from "formik";
import { Copy, Plus, Users } from "lucide-react";
import { Button } from "@/components/button";
import { ChampionshipRoster } from "@/components/championship-roster";
import { FormError } from "@/components/form-error";
import { PlayerRatingField } from "@/components/player-rating-field";
import { SectionCard } from "@/components/section-card";
import type { AssignableChampionshipRole } from "@/const/championship-role";
import { addPlayerFormSchema } from "@/const/form-schema";
import {
	PLAYER_NAME_LIST,
	parsePlayerNameList,
} from "@/const/player-name-list";
import { PLAYER_RATING } from "@/const/player-rating";
import { BUTTON_VARIANT, ERROR_CLASS, FIELD_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

type ChampionshipRosterTabProps = {
	players: ChampionshipPlayer[];
	createdBy: string;
	currentUserId: string | null;
	rosterCeiling: number;
	copied: boolean;
	canInvite: boolean;
	canUpdateRating: boolean;
	canSetRoles: boolean;
	canUnlink: boolean;
	canDeactivate: boolean;
	isAddingPlayer: boolean;
	addPlayerError: string | null;
	claimingPlayerId: number | null;
	claimError: string | null;
	ratingPlayerId: number | null;
	ratingError: string | null;
	nicknamePlayerId: number | null;
	roleError: string | null;
	unlinkingPlayerId: number | null;
	unlinkError: string | null;
	canMerge: boolean;
	mergeError: string | null;
	deactivatingPlayerId: number | null;
	deactivateError: string | null;
	onCopyLink: () => void;
	onAddPlayer: (values: {
		displayNames: string[];
		rating: number;
	}) => Promise<void>;
	onClaim: (playerId: number) => void;
	onChangeRating: (playerId: number, rating: number) => void;
	onEditNickname: (playerId: number) => void;
	onEditEventStats?: (playerId: number) => void;
	eventStatsPlayerId?: number | null;
	onChangeRole: (playerId: number, role: AssignableChampionshipRole) => void;
	onUnlink: (playerId: number) => void;
	onMerge: (playerId: number) => void;
	onDeactivate: (playerId: number) => void;
};

export function ChampionshipRosterTab({
	players,
	createdBy,
	currentUserId,
	rosterCeiling,
	copied,
	canInvite,
	canUpdateRating,
	canSetRoles,
	canUnlink,
	canDeactivate,
	isAddingPlayer,
	addPlayerError,
	claimingPlayerId,
	claimError,
	ratingPlayerId,
	ratingError,
	nicknamePlayerId,
	roleError,
	unlinkingPlayerId,
	unlinkError,
	canMerge,
	mergeError,
	deactivatingPlayerId,
	deactivateError,
	onCopyLink,
	onAddPlayer,
	onClaim,
	onChangeRating,
	onEditNickname,
	onEditEventStats,
	eventStatsPlayerId,
	onChangeRole,
	onUnlink,
	onMerge,
	onDeactivate,
}: ChampionshipRosterTabProps) {
	return (
		<SectionCard
			title="Elenco"
			icon={<Users className="size-4 text-pitch-fg" />}
			action={
				canInvite && (
					<>
						{copied && (
							<span className="text-sm font-normal text-fg-muted">
								Link copiado.
							</span>
						)}
						<Button variant={BUTTON_VARIANT.secondary} onClick={onCopyLink}>
							<Copy className="size-4" />
							Copiar link de convite
						</Button>
					</>
				)
			}
		>
			{canInvite && (
				<Formik
					initialValues={{
						name: "",
						rating: PLAYER_RATING.default,
					}}
					validationSchema={addPlayerFormSchema}
					onSubmit={async (values, helpers) => {
						await onAddPlayer({
							displayNames: parsePlayerNameList(values.name),
							rating: values.rating,
						});
						helpers.resetForm();
					}}
				>
					<Form className="mb-4 space-y-2">
						<div className="flex flex-col items-stretch gap-2 md:flex-row md:flex-wrap md:items-start">
							<Field
								as="textarea"
								name="name"
								rows={4}
								placeholder={PLAYER_NAME_LIST.placeholder}
								className={`min-h-20 w-full min-w-0 flex-1 resize-y !h-auto ${FIELD_CLASS}`}
							/>
							<div className="hidden md:block">
								<PlayerRatingField ceiling={rosterCeiling} />
							</div>
							<Button
								type="submit"
								variant={BUTTON_VARIANT.ghost}
								disabled={isAddingPlayer}
								aria-label="Adicionar jogador"
								className="w-full px-2 !text-pitch-fg hover:!bg-pitch-soft md:w-auto"
							>
								<Plus className="size-4" />
								add
							</Button>
						</div>
						<FormError name="name" />
						<FormError name="rating" />
					</Form>
				</Formik>
			)}
			{addPlayerError && (
				<p className={`mb-4 ${ERROR_CLASS}`}>{addPlayerError}</p>
			)}
			<ChampionshipRoster
				players={players}
				createdBy={createdBy}
				currentUserId={currentUserId}
				claimingPlayerId={claimingPlayerId}
				onClaim={onClaim}
				onChangeRating={canUpdateRating ? onChangeRating : undefined}
				ratingPlayerId={ratingPlayerId}
				onEditNickname={onEditNickname}
				nicknamePlayerId={nicknamePlayerId}
				onEditEventStats={onEditEventStats}
				eventStatsPlayerId={eventStatsPlayerId}
				onChangeRole={canSetRoles ? onChangeRole : undefined}
				onUnlink={canUnlink ? onUnlink : undefined}
				unlinkingPlayerId={unlinkingPlayerId}
				onMerge={canMerge ? onMerge : undefined}
				onDeactivate={canDeactivate ? onDeactivate : undefined}
				deactivatingPlayerId={deactivatingPlayerId}
			/>
			{claimError && <p className={`mt-4 ${ERROR_CLASS}`}>{claimError}</p>}
			{unlinkError && <p className={`mt-4 ${ERROR_CLASS}`}>{unlinkError}</p>}
			{mergeError && <p className={`mt-4 ${ERROR_CLASS}`}>{mergeError}</p>}
			{deactivateError && (
				<p className={`mt-4 ${ERROR_CLASS}`}>{deactivateError}</p>
			)}
			{ratingError && <p className={`mt-4 ${ERROR_CLASS}`}>{ratingError}</p>}
			{roleError && <p className={`mt-4 ${ERROR_CLASS}`}>{roleError}</p>}
		</SectionCard>
	);
}
