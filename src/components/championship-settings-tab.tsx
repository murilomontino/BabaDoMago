import { Field, Form, Formik } from "formik";
import { Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { FormError } from "@/components/form-error";
import { SectionCard } from "@/components/section-card";
import { CHAMPIONSHIP_EVENT, parseEventTime } from "@/const/championship-event";
import {
	eventConfigFormSchema,
	nameFormSchema,
	transferOwnerSchema,
} from "@/const/form-schema";
import { playerVisibleName } from "@/const/player-name";
import { BUTTON_VARIANT, ERROR_CLASS, FIELD_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";

type ChampionshipSettingsTabProps = {
	name: string;
	createdBy: string;
	eventTime: string;
	playersPerTeam: number;
	activePlayers: ChampionshipPlayer[];
	canRename: boolean;
	canUpdateEventConfig: boolean;
	canTransferOwnership: boolean;
	canDelete: boolean;
	isRenaming: boolean;
	renameError: string | null;
	isUpdatingEventConfig: boolean;
	eventConfigError: string | null;
	isTransferring: boolean;
	transferError: string | null;
	onRename: (name: string) => Promise<void>;
	onUpdateEventConfig: (values: {
		eventTime: string;
		playersPerTeam: number;
	}) => Promise<void>;
	onTransferOwner: (playerId: number) => Promise<void>;
	onDelete: () => void;
};

export function ChampionshipSettingsTab({
	name,
	createdBy,
	eventTime,
	playersPerTeam,
	activePlayers,
	canRename,
	canUpdateEventConfig,
	canTransferOwnership,
	canDelete,
	isRenaming,
	renameError,
	isUpdatingEventConfig,
	eventConfigError,
	isTransferring,
	transferError,
	onRename,
	onUpdateEventConfig,
	onTransferOwner,
	onDelete,
}: ChampionshipSettingsTabProps) {
	const canConfigure =
		canRename || canUpdateEventConfig || canTransferOwnership || canDelete;

	return (
		<div className="space-y-6">
			{!canConfigure && (
				<EmptyState
					icon={<Shield className="size-10" />}
					title="Nada para configurar"
					description="Você não pode alterar este campeonato."
				/>
			)}
			{(canRename || canUpdateEventConfig || canTransferOwnership) && (
				<SectionCard
					title="Configuração"
					icon={<Shield className="size-4 text-pitch-fg" />}
				>
					<div className="space-y-4">
						{canRename && (
							<Formik
								initialValues={{ name }}
								enableReinitialize
								validationSchema={nameFormSchema}
								onSubmit={async (values) => {
									await onRename(values.name);
								}}
							>
								<Form className="space-y-1.5">
									<label
										htmlFor="championship-name"
										className="text-sm font-medium text-fg-muted"
									>
										Nome
									</label>
									<div className="flex items-center gap-2">
										<Field
											id="championship-name"
											name="name"
											className={`min-w-0 flex-1 ${FIELD_CLASS}`}
										/>
										<Button
											type="submit"
											variant={BUTTON_VARIANT.secondary}
											disabled={isRenaming}
											className="h-9 shrink-0"
										>
											Salvar
										</Button>
									</div>
									<FormError name="name" />
								</Form>
							</Formik>
						)}
						{renameError && <p className={ERROR_CLASS}>{renameError}</p>}
						{canUpdateEventConfig && (
							<Formik
								initialValues={{
									eventTime,
									playersPerTeam,
								}}
								enableReinitialize
								validationSchema={eventConfigFormSchema}
								onSubmit={async (values) => {
									await onUpdateEventConfig({
										eventTime: parseEventTime(values.eventTime),
										playersPerTeam: Number(values.playersPerTeam),
									});
								}}
							>
								<Form className="space-y-3">
									<label
										htmlFor="championship-event-time"
										className="block text-sm font-medium text-fg-muted"
									>
										Hora do evento
										<Field
											id="championship-event-time"
											name="eventTime"
											type="time"
											className={`mt-1 ${FIELD_CLASS}`}
										/>
									</label>
									<FormError name="eventTime" />
									<label
										htmlFor="championship-players-per-team"
										className="block text-sm font-medium text-fg-muted"
									>
										Jogadores por time
										<Field
											id="championship-players-per-team"
											name="playersPerTeam"
											type="number"
											min={CHAMPIONSHIP_EVENT.playersPerTeamMin}
											max={CHAMPIONSHIP_EVENT.playersPerTeamMax}
											className={`mt-1 ${FIELD_CLASS}`}
										/>
									</label>
									<FormError name="playersPerTeam" />
									<Button
										type="submit"
										variant={BUTTON_VARIANT.secondary}
										disabled={isUpdatingEventConfig}
										className="h-9"
									>
										Salvar
									</Button>
								</Form>
							</Formik>
						)}
						{eventConfigError && (
							<p className={ERROR_CLASS}>{eventConfigError}</p>
						)}
						{canTransferOwnership && (
							<Formik
								initialValues={{ playerId: "" }}
								validationSchema={transferOwnerSchema}
								validateOnMount
								onSubmit={async (values, helpers) => {
									const playerId = Number(values.playerId);
									if (!Number.isFinite(playerId)) {
										return;
									}

									if (
										!window.confirm(
											"Transferir o campeonato? Você vira Normal.",
										)
									) {
										return;
									}

									await onTransferOwner(playerId);
									helpers.resetForm();
								}}
							>
								{({ isValid }) => (
									<Form className="space-y-1.5">
										<label
											htmlFor="championship-owner"
											className="text-sm font-medium text-fg-muted"
										>
											Novo dono
										</label>
										<div className="flex items-center gap-2">
											<Field
												as="select"
												id="championship-owner"
												name="playerId"
												className={`min-w-0 flex-1 ${FIELD_CLASS}`}
											>
												<option value="">Selecionar jogador</option>
												{activePlayers
													.filter(
														(player) =>
															player.user_id && player.user_id !== createdBy,
													)
													.map((player) => (
														<option key={player.id} value={player.id}>
															{playerVisibleName(player)}
														</option>
													))}
											</Field>
											<Button
												type="submit"
												variant={BUTTON_VARIANT.secondary}
												disabled={isTransferring || !isValid}
												className="h-9 shrink-0"
											>
												Transferir
											</Button>
										</div>
										<FormError name="playerId" />
									</Form>
								)}
							</Formik>
						)}
						{transferError && <p className={ERROR_CLASS}>{transferError}</p>}
					</div>
				</SectionCard>
			)}
			{canDelete && (
				<SectionCard
					title="Zona de perigo"
					icon={<Trash2 className="size-4 text-danger-fg" />}
				>
					<Button variant={BUTTON_VARIANT.danger} onClick={onDelete}>
						<Trash2 className="size-4" />
						Excluir campeonato
					</Button>
				</SectionCard>
			)}
		</div>
	);
}
