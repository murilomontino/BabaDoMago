import { Field, type FieldProps, Form, Formik } from "formik";
import { ChevronDown, Shield, Trash2 } from "lucide-react";
import type { MouseEvent } from "react";
import { Switch } from "@/components/atoms/switch";
import { Button } from "@/components/button";
import { ChampionshipDeactivatedTab } from "@/components/championship-deactivated-tab";
import { EmptyState } from "@/components/empty-state";
import { FormError } from "@/components/form-error";
import { SectionCard } from "@/components/section-card";
import {
	CHAMPIONSHIP_EVENT,
	EVENT_CONFIG_LABEL,
	EVENT_WEEKDAY_OPTIONS,
	parseChampionshipLocation,
	parseEventTime,
	parseEventWeekday,
} from "@/const/championship-event";
import {
	CHAMPIONSHIP_VISIBILITY,
	CHAMPIONSHIP_VISIBILITY_OPTIONS,
	championshipVisibilityStatus,
} from "@/const/championship-visibility";
import {
	eventConfigFormSchema,
	nameFormSchema,
	transferOwnerSchema,
} from "@/const/form-schema";
import { playerVisibleName } from "@/const/player-name";
import {
	BUTTON_VARIANT,
	buttonClassName,
	ERROR_CLASS,
	FIELD_CLASS,
} from "@/const/ui";
import { handlerWhenAllowed } from "@/lib/handler-when-allowed";
import type { ChampionshipPlayer } from "@/types/championship";

const DANGER_ROW_CLASS =
	"flex flex-wrap items-center justify-between gap-4 rounded-lg border border-danger-fg/30 p-4";

type ChampionshipSettingsTabProps = {
	name: string;
	createdBy: string;
	eventTime: string;
	eventWeekday: number | null;
	location: string | null;
	playersPerTeam: number;
	skipGuestGoalkeeperMatches: boolean;
	isVisible: boolean;
	activePlayers: ChampionshipPlayer[];
	canRename: boolean;
	canUpdateEventConfig: boolean;
	canUpdateVisibility: boolean;
	canTransferOwnership: boolean;
	canDelete: boolean;
	canReactivate: boolean;
	canRemove: boolean;
	deactivatedPlayers: ChampionshipPlayer[];
	currentUserId: string | null;
	reactivatingPlayerId: number | null;
	reactivateError: string | null;
	removingPlayerId: number | null;
	removeError: string | null;
	isRenaming: boolean;
	renameError: string | null;
	isUpdatingEventConfig: boolean;
	eventConfigError: string | null;
	isUpdatingVisibility: boolean;
	visibilityError: string | null;
	isTransferring: boolean;
	transferError: string | null;
	onRename: (name: string) => Promise<void>;
	onUpdateEventConfig: (values: {
		eventTime: string;
		eventWeekday: number | null;
		location: string | null;
		playersPerTeam: number;
		skipGuestGoalkeeperMatches: boolean;
	}) => Promise<void>;
	onUpdateVisibility: (isVisible: boolean) => void;
	onTransferOwner: (playerId: number) => Promise<void>;
	onDelete: () => void;
	onReactivate: (playerId: number) => void;
	onRemove: (playerId: number) => void;
};

export function ChampionshipSettingsTab({
	name,
	createdBy,
	eventTime,
	eventWeekday,
	location,
	playersPerTeam,
	skipGuestGoalkeeperMatches,
	isVisible,
	activePlayers,
	canRename,
	canUpdateEventConfig,
	canUpdateVisibility,
	canTransferOwnership,
	canDelete,
	canReactivate,
	canRemove,
	deactivatedPlayers,
	currentUserId,
	reactivatingPlayerId,
	reactivateError,
	removingPlayerId,
	removeError,
	isRenaming,
	renameError,
	isUpdatingEventConfig,
	eventConfigError,
	isUpdatingVisibility,
	visibilityError,
	isTransferring,
	transferError,
	onRename,
	onUpdateEventConfig,
	onUpdateVisibility,
	onTransferOwner,
	onDelete,
	onReactivate,
	onRemove,
}: ChampionshipSettingsTabProps) {
	const canConfigure =
		canRename ||
		canUpdateEventConfig ||
		canUpdateVisibility ||
		canTransferOwnership ||
		canDelete;
	const showDangerZone =
		canUpdateVisibility || canTransferOwnership || canDelete;

	function handleVisibilityPick(
		nextVisible: boolean,
		event: MouseEvent<HTMLButtonElement>,
	) {
		event.currentTarget.closest("details")?.removeAttribute("open");
		if (nextVisible === isVisible) {
			return;
		}

		onUpdateVisibility(nextVisible);
	}

	return (
		<div className="space-y-6">
			{!canConfigure && !canReactivate && !canRemove && (
				<EmptyState
					icon={<Shield className="size-10" />}
					title="Nada para configurar"
					description="Você não pode alterar este campeonato."
				/>
			)}
			{(canRename || canUpdateEventConfig) && (
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
									eventWeekday: eventWeekday ?? "",
									location: location ?? "",
									playersPerTeam,
									skipGuestGoalkeeperMatches,
								}}
								enableReinitialize
								validationSchema={eventConfigFormSchema}
								onSubmit={async (values) => {
									await onUpdateEventConfig({
										eventTime: parseEventTime(values.eventTime),
										eventWeekday: parseEventWeekday(values.eventWeekday),
										location: parseChampionshipLocation(values.location),
										playersPerTeam: Number(values.playersPerTeam),
										skipGuestGoalkeeperMatches:
											values.skipGuestGoalkeeperMatches,
									});
								}}
							>
								<Form className="space-y-3">
									<label
										htmlFor="championship-event-weekday"
										className="block text-sm font-medium text-fg-muted"
									>
										{EVENT_CONFIG_LABEL.eventWeekday}
										<Field
											id="championship-event-weekday"
											as="select"
											name="eventWeekday"
											className={`mt-1 ${FIELD_CLASS}`}
										>
											<option value="">
												{EVENT_CONFIG_LABEL.eventWeekdayNone}
											</option>
											{EVENT_WEEKDAY_OPTIONS.map((option) => (
												<option key={option.value} value={option.value}>
													{option.label}
												</option>
											))}
										</Field>
									</label>
									<FormError name="eventWeekday" />
									<label
										htmlFor="championship-event-time"
										className="block text-sm font-medium text-fg-muted"
									>
										Hora da rodada
										<Field
											id="championship-event-time"
											name="eventTime"
											type="time"
											className={`mt-1 ${FIELD_CLASS}`}
										/>
									</label>
									<FormError name="eventTime" />
									<label
										htmlFor="championship-location"
										className="block text-sm font-medium text-fg-muted"
									>
										{EVENT_CONFIG_LABEL.location}
										<Field
											id="championship-location"
											name="location"
											type="text"
											maxLength={CHAMPIONSHIP_EVENT.locationMaxLength}
											placeholder="Society do parque, campo 2"
											className={`mt-1 ${FIELD_CLASS}`}
										/>
									</label>
									<FormError name="location" />
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
									<div className="flex items-start justify-between gap-4">
										<span className="min-w-0 text-sm">
											<label
												htmlFor="championship-skip-guest-goalkeeper-matches"
												className="font-medium text-fg"
											>
												{EVENT_CONFIG_LABEL.skipGuestGoalkeeperMatches}
											</label>
											<span className="mt-1 block text-fg-muted">
												{EVENT_CONFIG_LABEL.skipGuestGoalkeeperMatchesHint}
											</span>
										</span>
										<Field name="skipGuestGoalkeeperMatches">
											{(props: FieldProps<boolean>) => (
												<Switch
													id="championship-skip-guest-goalkeeper-matches"
													checked={
														props.field.value ??
														CHAMPIONSHIP_EVENT.skipGuestGoalkeeperMatchesDefault
													}
													onCheckedChange={(checked) => {
														void props.form.setFieldValue(
															props.field.name,
															checked,
														);
													}}
												/>
											)}
										</Field>
									</div>
									<FormError name="skipGuestGoalkeeperMatches" />
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
					</div>
				</SectionCard>
			)}
			{(canReactivate || canRemove) && (
				<ChampionshipDeactivatedTab
					players={deactivatedPlayers}
					createdBy={createdBy}
					currentUserId={currentUserId}
					reactivatingPlayerId={reactivatingPlayerId}
					reactivateError={reactivateError}
					onReactivate={onReactivate}
					removingPlayerId={removingPlayerId}
					removeError={removeError}
					onRemove={handlerWhenAllowed(canRemove, onRemove)}
				/>
			)}
			{showDangerZone && (
				<SectionCard
					title="Zona de perigo"
					icon={<Trash2 className="size-4 text-danger-fg" />}
				>
					<div className="space-y-3">
						{canUpdateVisibility && (
							<div className={DANGER_ROW_CLASS}>
								<div className="min-w-0">
									<p className="text-sm font-medium text-fg">
										{CHAMPIONSHIP_VISIBILITY.title}
									</p>
									<p className="mt-1 text-sm text-fg-muted">
										{championshipVisibilityStatus(isVisible)}
									</p>
									{visibilityError && (
										<p className={`mt-2 ${ERROR_CLASS}`}>{visibilityError}</p>
									)}
								</div>
								<details
									className={`group relative ${isUpdatingVisibility ? "pointer-events-none opacity-50" : ""}`}
								>
									<summary
										className={`${buttonClassName(BUTTON_VARIANT.danger)} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
									>
										{CHAMPIONSHIP_VISIBILITY.changeLabel}
										<ChevronDown className="size-4 transition-transform group-open:rotate-180" />
									</summary>
									<ul className="absolute right-0 z-10 mt-2 min-w-56 rounded-lg border border-line bg-surface py-1 shadow-sm">
										{CHAMPIONSHIP_VISIBILITY_OPTIONS.map((option) => (
											<li key={option.id}>
												<button
													type="button"
													disabled={
														isUpdatingVisibility ||
														option.isVisible === isVisible
													}
													onClick={(event) => {
														handleVisibilityPick(option.isVisible, event);
													}}
													className="flex w-full px-3 py-2 text-left text-sm text-fg hover:bg-surface-muted disabled:opacity-50"
												>
													{option.label}
												</button>
											</li>
										))}
									</ul>
								</details>
							</div>
						)}
						{canTransferOwnership && (
							<div className={DANGER_ROW_CLASS}>
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
										<Form className="flex min-w-0 flex-1 flex-wrap items-end justify-between gap-4">
											<div className="min-w-0 flex-1 space-y-1.5">
												<label
													htmlFor="championship-owner"
													className="text-sm font-medium text-fg"
												>
													Novo dono
												</label>
												<p className="text-sm text-fg-muted">
													Você vira Normal.
												</p>
												<Field
													as="select"
													id="championship-owner"
													name="playerId"
													className={FIELD_CLASS}
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
												<FormError name="playerId" />
												{transferError && (
													<p className={ERROR_CLASS}>{transferError}</p>
												)}
											</div>
											<Button
												type="submit"
												variant={BUTTON_VARIANT.danger}
												disabled={isTransferring || !isValid}
												className="h-9 shrink-0"
											>
												Transferir
											</Button>
										</Form>
									)}
								</Formik>
							</div>
						)}
						{canDelete && (
							<div className={DANGER_ROW_CLASS}>
								<div className="min-w-0">
									<p className="text-sm font-medium text-fg">
										Excluir campeonato
									</p>
									<p className="mt-1 text-sm text-fg-muted">
										Remove o baba para todos os jogadores.
									</p>
								</div>
								<Button variant={BUTTON_VARIANT.danger} onClick={onDelete}>
									<Trash2 className="size-4" />
									Excluir campeonato
								</Button>
							</div>
						)}
					</div>
				</SectionCard>
			)}
		</div>
	);
}
