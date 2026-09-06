import { createColumnHelper } from "@tanstack/react-table";
import { Crosshair, Scale } from "lucide-react";
import { useMemo } from "react";
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
	championshipRatingGap,
	formatRatingGap,
	formatRatingGapValue,
	RATING_GAP_LABEL,
	ratingGapKindLabel,
	type RatingGapRow,
} from "@/const/championship-rating-gap";
import { playerVisibleName } from "@/const/player-name";
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

export function ChampionshipProjectionsTab({
	players,
	events,
	isOwner,
}: ChampionshipProjectionsTabProps) {
	const calibration = useMemo(
		() => championshipProjectionCalibration(events, isOwner),
		[events, isOwner],
	);
	const gapRows = useMemo(
		() => (isOwner ? championshipRatingGap(players) : []),
		[isOwner, players],
	);

	const sourceLabel = () => {
		if (calibration.source === "hidden") {
			return PROJECTION_CALIBRATION_LABEL.sourceHidden;
		}

		return PROJECTION_CALIBRATION_LABEL.sourcePublic;
	};

	return (
		<div className="space-y-6">
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
