import { useNavigate } from "@tanstack/react-router";
import { Handshake } from "lucide-react";
import { useMemo, useState } from "react";
import {
	CartesianGrid,
	ResponsiveContainer,
	Scatter,
	ScatterChart,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { PlayerNameLink } from "@/components/molecules/player-name-link";
import { playerVisibleName } from "@/const/player-name";
import {
	formatSynergyDeltaPp,
	formatSynergyStat,
	type PlayerSynergyResult,
	parseSynergyFocus,
	parseSynergyNetworkLimit,
	parseSynergyWindow,
	SYNERGY_COLUMN,
	SYNERGY_FOCUS_DEFAULT,
	SYNERGY_FOCUS_LABEL,
	SYNERGY_FOCUS_OPTIONS,
	SYNERGY_LABEL,
	SYNERGY_NETWORK_CHART,
	SYNERGY_NETWORK_LIMIT_DEFAULT,
	SYNERGY_NETWORK_LIMIT_OPTIONS,
	SYNERGY_VOLUME_LABEL,
	SYNERGY_WINDOW_LABEL,
	SYNERGY_WINDOW_OPTIONS,
	type SynergyFocus,
	type SynergyNetworkLimit,
	type SynergyPartnerRow,
	type SynergyWindow,
	synergyEdgeStrokeWidth,
	synergyEmptyMessage,
	synergyPartnerEdgeLabel,
	synergyPartnersForFocus,
	synergyWrBandColor,
} from "@/const/player-synergy";
import { formatRosterWinRate } from "@/const/roster-stats";
import { ROUTES } from "@/const/routes";
import { BUTTON_VARIANT, FIELD_CLASS } from "@/const/ui";

type PlayerSynergyNetworkProps = {
	player: {
		id: number;
		championship_id: number;
		display_name: string;
		nickname: string | null;
		avatar_url: string | null;
	};
	result: PlayerSynergyResult;
	window: SynergyWindow;
	onWindowChange: (window: SynergyWindow) => void;
};

type SynergyScatterPoint = {
	id: number;
	name: string;
	matches: number;
	winRate: number;
	winRatePct: number;
	color: string;
};

function partnerInitial(name: string): string {
	return name.charAt(0).toUpperCase() || "?";
}

function SynergyPartnerRankList({
	title,
	rows,
}: {
	title: string;
	rows: readonly SynergyPartnerRow[];
}) {
	if (rows.length === 0) {
		return null;
	}

	return (
		<div className="space-y-2">
			<h3 className="text-sm font-medium text-fg">{title}</h3>
			<ul className="space-y-2">
				{rows.map((row) => (
					<li
						key={row.partner.id}
						className="flex items-center justify-between gap-2 text-sm"
					>
						<PlayerNameLink player={row.partner} />
						<span className="shrink-0 tabular-nums text-fg-muted">
							{formatSynergyStat(SYNERGY_COLUMN.winRate, row.winRate)} ·{" "}
							{formatSynergyStat(SYNERGY_COLUMN.matches, row.matches)}J
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}

function SynergyPairDetail({
	playerName,
	playerWinRate,
	row,
}: {
	playerName: string;
	playerWinRate: number;
	row: SynergyPartnerRow;
}) {
	const partnerName = playerVisibleName(row.partner);

	return (
		<div className="rounded-lg border border-line bg-surface-muted/40 p-3 text-sm">
			<p className="font-medium text-fg">
				{playerName} + {partnerName}
			</p>
			<p className="mt-1 text-fg-muted">{SYNERGY_LABEL.hint}</p>
			<dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
				<dt className="text-fg-muted">{SYNERGY_LABEL.pairWinRate}</dt>
				<dd className="text-right tabular-nums text-fg">
					{formatSynergyStat(SYNERGY_COLUMN.winRate, row.winRate)}
				</dd>
				<dt className="text-fg-muted">{SYNERGY_LABEL.games}</dt>
				<dd className="text-right tabular-nums text-fg">
					{formatSynergyStat(SYNERGY_COLUMN.matches, row.matches)}
				</dd>
				<dt className="text-fg-muted">{SYNERGY_LABEL.wins}</dt>
				<dd className="text-right tabular-nums text-fg">{row.wins}</dd>
				<dt className="text-fg-muted">{SYNERGY_LABEL.draws}</dt>
				<dd className="text-right tabular-nums text-fg">{row.draws}</dd>
				<dt className="text-fg-muted">{SYNERGY_LABEL.losses}</dt>
				<dd className="text-right tabular-nums text-fg">{row.losses}</dd>
				<dt className="text-fg-muted">{SYNERGY_LABEL.playerWinRate}</dt>
				<dd className="text-right tabular-nums text-fg">
					{formatRosterWinRate(playerWinRate)}
				</dd>
				<dt className="text-fg-muted">{SYNERGY_LABEL.synergyDelta}</dt>
				<dd className="text-right tabular-nums text-fg">
					{formatSynergyDeltaPp(row.synergyDelta)}
				</dd>
				<dt className="text-fg-muted">{SYNERGY_LABEL.volume}</dt>
				<dd className="text-right text-fg">
					{SYNERGY_VOLUME_LABEL[row.volumeLevel]}
				</dd>
			</dl>
		</div>
	);
}

function SynergyNetworkSvg({
	player,
	partners,
	selectedPartnerId,
	onSelectPartner,
}: {
	player: PlayerSynergyNetworkProps["player"];
	partners: readonly SynergyPartnerRow[];
	selectedPartnerId: number | null;
	onSelectPartner: (partnerId: number) => void;
}) {
	const navigate = useNavigate();
	const size = SYNERGY_NETWORK_CHART.size;
	const center = size / 2;
	const playerName = playerVisibleName(player);

	const nodes = useMemo(() => {
		const count = partners.length;
		if (count === 0) {
			return [];
		}

		return partners.map((row, index) => {
			const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
			const x = center + SYNERGY_NETWORK_CHART.orbit * Math.cos(angle);
			const y = center + SYNERGY_NETWORK_CHART.orbit * Math.sin(angle);
			return { row, x, y, midX: (center + x) / 2, midY: (center + y) / 2 };
		});
	}, [partners, center]);

	return (
		<div className="relative mx-auto w-full max-w-md">
			<svg
				viewBox={`0 0 ${size} ${size}`}
				className="h-auto w-full"
				role="img"
				aria-label={SYNERGY_LABEL.network}
			>
				{nodes.map(({ row, x, y }) => {
					const selected = selectedPartnerId === row.partner.id;

					return (
						<g key={row.partner.id}>
							<line
								x1={center}
								y1={center}
								x2={x}
								y2={y}
								stroke={synergyWrBandColor(row.winRate)}
								strokeWidth={synergyEdgeStrokeWidth(row.matches)}
								strokeOpacity={selected ? 1 : 0.75}
							/>
							<circle
								cx={x}
								cy={y}
								r={SYNERGY_NETWORK_CHART.partnerRadius}
								fill={selected ? "var(--color-pitch, #0f766e)" : "#e2e8f0"}
								stroke={synergyWrBandColor(row.winRate)}
								strokeWidth={selected ? 3 : 2}
							/>
							<text
								x={x}
								y={y + 4}
								textAnchor="middle"
								className="fill-fg text-[11px] font-medium"
							>
								{partnerInitial(playerVisibleName(row.partner))}
							</text>
						</g>
					);
				})}
				<circle
					cx={center}
					cy={center}
					r={SYNERGY_NETWORK_CHART.centerRadius}
					fill="var(--color-pitch, #0f766e)"
				/>
				<text
					x={center}
					y={center + 4}
					textAnchor="middle"
					className="fill-white text-[12px] font-semibold"
				>
					{partnerInitial(playerName)}
				</text>
				<text
					x={center}
					y={center + SYNERGY_NETWORK_CHART.centerRadius + 14}
					textAnchor="middle"
					className="fill-fg text-[11px] font-medium"
				>
					{playerName}
				</text>
			</svg>
			{nodes.map(({ row, x, y, midX, midY }) => {
				const partnerName = playerVisibleName(row.partner);
				const edgeLabel = synergyPartnerEdgeLabel(row.winRate, row.matches);

				return (
					<div key={`hit-${row.partner.id}`}>
						<button
							type="button"
							className="-translate-x-1/2 -translate-y-1/2 absolute rounded bg-surface/90 px-1 py-0.5 text-[10px] tabular-nums text-fg shadow-sm"
							style={{
								left: `${(midX / size) * 100}%`,
								top: `${(midY / size) * 100}%`,
							}}
							aria-label={`${playerName} + ${partnerName}: ${edgeLabel}`}
							onClick={() => onSelectPartner(row.partner.id)}
						>
							{edgeLabel}
						</button>
						<button
							type="button"
							className="-translate-x-1/2 absolute rounded px-1 pt-1 text-[10px] text-fg hover:text-pitch-fg"
							style={{
								left: `${(x / size) * 100}%`,
								top: `${((y + SYNERGY_NETWORK_CHART.partnerRadius) / size) * 100}%`,
							}}
							aria-label={partnerName}
							onClick={() => {
								void navigate({
									to: ROUTES.championshipPlayer,
									params: {
										championshipId: String(row.partner.championship_id),
										playerId: String(row.partner.id),
									},
								});
							}}
						>
							{partnerName}
						</button>
					</div>
				);
			})}
		</div>
	);
}

function synergyScatterTooltip({
	active,
	payload,
}: {
	active?: boolean;
	payload?: readonly { payload?: SynergyScatterPoint }[];
}) {
	if (!active) {
		return null;
	}

	const point = payload?.[0]?.payload;
	if (!point) {
		return null;
	}

	return (
		<div className="rounded-md border border-black/10 bg-surface px-2.5 py-2 text-xs shadow-sm">
			<p className="font-medium text-fg">{point.name}</p>
			<p className="text-fg-muted">
				{SYNERGY_LABEL.games}: {point.matches}
			</p>
			<p className="text-fg-muted">
				{SYNERGY_LABEL.pairWinRate}: {formatRosterWinRate(point.winRate)}
			</p>
		</div>
	);
}

function SynergyScatterDot(props: {
	cx?: number;
	cy?: number;
	payload?: SynergyScatterPoint;
}) {
	const { cx, cy, payload } = props;
	if (cx === undefined || cy === undefined || !payload) {
		return null;
	}

	return (
		<circle
			cx={cx}
			cy={cy}
			r={6}
			fill={payload.color}
			stroke="white"
			strokeWidth={1}
		/>
	);
}

function SynergyScatter({
	partners,
}: {
	partners: readonly SynergyPartnerRow[];
}) {
	const points = useMemo(
		() =>
			partners.map(
				(row): SynergyScatterPoint => ({
					id: row.partner.id,
					name: playerVisibleName(row.partner),
					matches: row.matches,
					winRate: row.winRate,
					winRatePct: Math.round(row.winRate * 100),
					color: synergyWrBandColor(row.winRate),
				}),
			),
		[partners],
	);

	if (points.length === 0) {
		return null;
	}

	return (
		<div className="space-y-2">
			<h3 className="text-sm font-medium text-fg">{SYNERGY_LABEL.scatter}</h3>
			<div style={{ height: SYNERGY_NETWORK_CHART.scatterHeight }}>
				<ResponsiveContainer width="100%" height="100%">
					<ScatterChart margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
						<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
						<XAxis
							type="number"
							dataKey="matches"
							name={SYNERGY_LABEL.games}
							tick={{ fontSize: 11 }}
							allowDecimals={false}
						/>
						<YAxis
							type="number"
							dataKey="winRatePct"
							name={SYNERGY_LABEL.pairWinRate}
							domain={[0, 100]}
							tick={{ fontSize: 11 }}
							unit="%"
						/>
						<Tooltip
							content={synergyScatterTooltip}
							cursor={{ strokeDasharray: "3 3" }}
						/>
						<Scatter data={points} shape={<SynergyScatterDot />} />
					</ScatterChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}

export function PlayerSynergyNetwork({
	player,
	result,
	window,
	onWindowChange,
}: PlayerSynergyNetworkProps) {
	const [focus, setFocus] = useState<SynergyFocus>(SYNERGY_FOCUS_DEFAULT);
	const [nodeLimit, setNodeLimit] = useState<SynergyNetworkLimit>(
		SYNERGY_NETWORK_LIMIT_DEFAULT,
	);
	const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(
		null,
	);

	const visiblePartners = useMemo(
		() => synergyPartnersForFocus(result.partners, focus, nodeLimit),
		[result.partners, focus, nodeLimit],
	);

	const selectedPartner = useMemo(() => {
		if (selectedPartnerId == null) {
			return null;
		}

		return (
			result.partners.find((row) => row.partner.id === selectedPartnerId) ??
			null
		);
	}, [result.partners, selectedPartnerId]);

	const emptyMessage = synergyEmptyMessage(result.partners, window);
	const playerName = playerVisibleName(player);

	return (
		<div className="space-y-4">
			<p className="text-sm text-fg-muted">{SYNERGY_LABEL.hint}</p>
			<p className="text-sm text-fg">
				{SYNERGY_LABEL.playerWinRate}:{" "}
				<span className="tabular-nums font-medium">
					{formatRosterWinRate(result.playerWinRate)}
				</span>
			</p>

			<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
				<label className="min-w-[8rem] flex-1 text-xs text-fg-muted">
					{SYNERGY_LABEL.filter}
					<select
						className={`mt-1 ${FIELD_CLASS}`}
						value={window}
						onChange={(event) => {
							onWindowChange(parseSynergyWindow(event.target.value));
						}}
					>
						{SYNERGY_WINDOW_OPTIONS.map((option) => (
							<option key={option} value={option}>
								{SYNERGY_WINDOW_LABEL[option]}
							</option>
						))}
					</select>
				</label>
				<label className="min-w-[8rem] flex-1 text-xs text-fg-muted">
					{SYNERGY_LABEL.nodeLimit}
					<select
						className={`mt-1 ${FIELD_CLASS}`}
						value={nodeLimit}
						onChange={(event) => {
							setNodeLimit(
								parseSynergyNetworkLimit(Number(event.target.value)),
							);
						}}
					>
						{SYNERGY_NETWORK_LIMIT_OPTIONS.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
				</label>
			</div>

			<div className="flex flex-wrap gap-1">
				{SYNERGY_FOCUS_OPTIONS.map((option) => {
					const active = focus === option;
					return (
						<Button
							key={option}
							type="button"
							variant={
								active ? BUTTON_VARIANT.primary : BUTTON_VARIANT.secondary
							}
							className="h-9 px-3 text-xs"
							onClick={() => {
								setFocus(parseSynergyFocus(option));
							}}
						>
							{SYNERGY_FOCUS_LABEL[option]}
						</Button>
					);
				})}
			</div>

			{result.partners.length === 0 && (
				<EmptyState
					icon={<Handshake className="size-10" />}
					title={emptyMessage}
				/>
			)}

			{result.partners.length > 0 && (
				<>
					<SynergyNetworkSvg
						player={player}
						partners={visiblePartners}
						selectedPartnerId={selectedPartnerId}
						onSelectPartner={setSelectedPartnerId}
					/>

					{selectedPartner && (
						<SynergyPairDetail
							playerName={playerName}
							playerWinRate={result.playerWinRate}
							row={selectedPartner}
						/>
					)}

					<div className="grid gap-4 sm:grid-cols-2">
						<SynergyPartnerRankList
							title={SYNERGY_LABEL.bestPartners}
							rows={result.bestPartners}
						/>
						<SynergyPartnerRankList
							title={SYNERGY_LABEL.worstPartners}
							rows={result.worstPartners}
						/>
					</div>

					<SynergyScatter partners={visiblePartners} />
				</>
			)}
		</div>
	);
}
