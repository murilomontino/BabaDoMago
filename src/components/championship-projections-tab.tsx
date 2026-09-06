import { createColumnHelper } from "@tanstack/react-table";
import { Crosshair, Scale, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { EmptyState } from "@/components/empty-state";
import { PlayerNameLink } from "@/components/molecules/player-name-link";
import {
	DataTable,
	type DataTableFeatures,
} from "@/components/organisms/data-table";
import { SectionCard } from "@/components/section-card";
import {
	championshipProjectionCalibration,
	formatProjectionCalibrationCount,
	formatProjectionCalibrationRate,
	PROJECTION_CALIBRATION_LABEL,
	type ProjectionCalibrationRow,
} from "@/const/championship-projection-calibration";
import {
	formatProjectedWinRate,
	MATCH_PROJECTION_LABEL,
	projectedFieldWinRates,
	projectionScaleFromFavoriteRates,
} from "@/const/championship-match-projection";
import {
	championshipRatingGap,
	formatRatingGap,
	formatRatingGapValue,
	RATING_GAP_LABEL,
	ratingGapKindLabel,
	type RatingGapRow,
} from "@/const/championship-rating-gap";
import {
	eventTeamHiddenBalance,
	hiddenStrengthWalk,
} from "@/const/hidden-strength";
import { playerVisibleName } from "@/const/player-name";
import { eventTeamBalance } from "@/const/team-balance-stats";
import { CHAMPIONSHIP_EVENTS_QUERY_KEY } from "@/hooks/championships/championships-query-keys";
import type { ChampionshipPlayer } from "@/types/championship";
import type { ChampionshipEvent } from "@/types/championship-event";

type ChampionshipProjectionsTabProps = {
	players: ChampionshipPlayer[];
	events: readonly ChampionshipEvent[];
	isOwner: boolean;
};

const calibrationHelper = createColumnHelper<
	DataTableFeatures,
	ProjectionCalibrationRow
>();
const gapHelper = createColumnHelper<DataTableFeatures, RatingGapRow>();

function CalibrationTable({ rows }: { rows: ProjectionCalibrationRow[] }) {
	const columns = useMemo(
		() =>
			calibrationHelper.columns([
				calibrationHelper.accessor("label", {
					id: "band",
					header: PROJECTION_CALIBRATION_LABEL.band,
					enableHiding: false,
				}),
				calibrationHelper.accessor("events", {
					id: "events",
					header: PROJECTION_CALIBRATION_LABEL.events,
					meta: { align: "right" as const },
					cell: ({ getValue }) => (
						<span className="tabular-nums">
							{formatProjectionCalibrationCount(getValue())}
						</span>
					),
				}),
				calibrationHelper.accessor("favoriteWinRate", {
					id: "rate",
					header: PROJECTION_CALIBRATION_LABEL.favoriteRate,
					meta: { align: "right" as const },
					cell: ({ getValue }) => (
						<span className="tabular-nums">
							{formatProjectionCalibrationRate(getValue())}
						</span>
					),
				}),
			]),
		[],
	);

	return (
		<DataTable
			data={rows}
			columns={columns}
			getRowId={(row) => row.bandId}
		/>
	);
}

function GapTable({ rows }: { rows: RatingGapRow[] }) {
	const columns = useMemo(
		() =>
			gapHelper.columns([
				gapHelper.accessor((row) => playerVisibleName(row.player), {
					id: "player",
					header: "Jogador",
					enableHiding: false,
					cell: ({ row }) => <PlayerNameLink player={row.original.player} />,
				}),
				gapHelper.accessor("publicSeed", {
					id: "seed",
					header: RATING_GAP_LABEL.publicSeed,
					meta: { align: "right" as const },
					cell: ({ getValue }) => (
						<span className="tabular-nums">
							{formatRatingGapValue(getValue())}
						</span>
					),
				}),
				gapHelper.accessor("hidden", {
					id: "hidden",
					header: RATING_GAP_LABEL.hidden,
					meta: { align: "right" as const },
					cell: ({ getValue }) => (
						<span className="tabular-nums">
							{formatRatingGapValue(getValue())}
						</span>
					),
				}),
				gapHelper.accessor("gap", {
					id: "gap",
					header: RATING_GAP_LABEL.gap,
					meta: { align: "right" as const },
					cell: ({ row }) => (
						<span className="tabular-nums">
							{formatRatingGap(row.original.gap)}
						</span>
					),
				}),
				gapHelper.accessor("kind", {
					id: "kind",
					header: "Tipo",
					cell: ({ getValue }) => ratingGapKindLabel(getValue()),
				}),
			]),
		[],
	);

	return (
		<DataTable
			data={rows}
			columns={columns}
			getRowId={(row) => String(row.player.id)}
		/>
	);
}

function latestOpenOrEndedEvent(
	events: readonly ChampionshipEvent[],
): ChampionshipEvent | null {
	const open = events.find((event) => event.ended_at === null);
	if (open) {
		return open;
	}

	return events[0] ?? null;
}

export function ChampionshipProjectionsTab({
	players,
	events,
	isOwner,
}: ChampionshipProjectionsTabProps) {
	const walk = useMemo(() => hiddenStrengthWalk(events), [events]);
	const calibration = useMemo(
		() => championshipProjectionCalibration(events, isOwner),
		[events, isOwner],
	);
	const scale = useMemo(
		() => projectionScaleFromFavoriteRates(calibration.samples),
		[calibration.samples],
	);
	const gapRows = useMemo(
		() => (isOwner ? championshipRatingGap(players) : []),
		[isOwner, players],
	);
	const focusEvent = useMemo(() => latestOpenOrEndedEvent(events), [events]);
	const projection = useMemo(() => {
		if (!focusEvent || focusEvent.teams.length < 2) {
			return null;
		}

		const hidden = eventTeamHiddenBalance(
			focusEvent,
			walk.hiddenBeforeEvent.get(focusEvent.id),
		);
		if (isOwner && hidden && hidden.teams.length >= 2) {
			const rates = projectedFieldWinRates(
				hidden.teams.map((team) => team.predictedHidden),
				scale,
			);
			return {
				teams: hidden.teams.map((team, index) => ({
					label: team.label,
					rate: rates[index] ?? 0,
				})),
				source: "hidden" as const,
			};
		}

		const publicBalance = eventTeamBalance(focusEvent);
		if (!publicBalance || publicBalance.teams.length < 2) {
			return null;
		}

		const rates = projectedFieldWinRates(
			publicBalance.teams.map((team) => team.predictedRating),
			scale,
		);
		return {
			teams: publicBalance.teams.map((team, index) => ({
				label: team.label,
				rate: rates[index] ?? 0,
			})),
			source: "public" as const,
		};
	}, [focusEvent, isOwner, scale, walk.hiddenBeforeEvent]);

	const sourceLabel = () => {
		if (calibration.source === "hidden") {
			return PROJECTION_CALIBRATION_LABEL.sourceHidden;
		}

		return PROJECTION_CALIBRATION_LABEL.sourcePublic;
	};

	return (
		<div className="space-y-6">
			<SectionCard
				title={MATCH_PROJECTION_LABEL.title}
				icon={<Sparkles className="size-4 text-pitch-fg" />}
				queryKey={CHAMPIONSHIP_EVENTS_QUERY_KEY}
			>
				<p className="text-sm text-fg-muted">{MATCH_PROJECTION_LABEL.hint}</p>
				{!projection && (
					<EmptyState
						icon={<Sparkles className="size-10" />}
						title={MATCH_PROJECTION_LABEL.empty}
					/>
				)}
				{projection && (
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
						{projection.teams.map((team) => (
							<div key={team.label}>
								<p className="text-xs font-medium text-fg-muted">{team.label}</p>
								<p className="text-lg font-semibold tabular-nums text-fg">
									{formatProjectedWinRate(team.rate)}
								</p>
							</div>
						))}
					</div>
				)}
			</SectionCard>

			<SectionCard
				title={PROJECTION_CALIBRATION_LABEL.title}
				icon={<Scale className="size-4 text-pitch-fg" />}
			>
				<p className="text-sm text-fg-muted">
					{PROJECTION_CALIBRATION_LABEL.hint}
				</p>
				<p className="text-xs text-fg-muted">{sourceLabel()}</p>
				{calibration.rows.length === 0 && (
					<p className="text-sm text-fg-muted">
						{PROJECTION_CALIBRATION_LABEL.empty}
					</p>
				)}
				{calibration.rows.length > 0 && (
					<CalibrationTable rows={calibration.rows} />
				)}
			</SectionCard>

			{isOwner && (
				<SectionCard
					title={RATING_GAP_LABEL.title}
					icon={<Crosshair className="size-4 text-pitch-fg" />}
				>
					<p className="text-sm text-fg-muted">{RATING_GAP_LABEL.hint}</p>
					{gapRows.length === 0 && (
						<p className="text-sm text-fg-muted">{RATING_GAP_LABEL.empty}</p>
					)}
					{gapRows.length > 0 && <GapTable rows={gapRows} />}
				</SectionCard>
			)}
		</div>
	);
}
