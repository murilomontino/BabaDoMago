import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import {
	analyzeEventMatchup,
	defaultMatchupPairKeys,
	formatMatchupMetricValue,
	formatMatchupPercent,
	formatMatchupPerGame,
	MATCHUP_LABEL,
	MATCHUP_METRIC,
	MATCHUP_SIDE,
	type MatchupAnalysis,
	type MatchupMetric,
	type MatchupMetricKey,
	type MatchupPlayerHighlight,
	type MatchupSide,
	type MatchupTeamInput,
	type MatchupTeamKeyPlayers,
	matchupBalanceLabel,
	matchupHasKeyPlayers,
	matchupMetricLabel,
} from "@/const/event-matchup-analysis";
import { FIELD_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";
import type { ChampionshipEvent } from "@/types/championship-event";

type EventMatchupAnalysisProps = {
	teams: readonly MatchupTeamInput[];
	historyEvents: readonly ChampionshipEvent[];
	roster: readonly ChampionshipPlayer[];
};

export type MatchupAnalysisTeamView = {
	title: string;
	color: string | null;
};

function sideTitle(
	side: MatchupSide,
	home: MatchupAnalysisTeamView,
	away: MatchupAnalysisTeamView,
): string {
	if (side === MATCHUP_SIDE.home) {
		return home.title;
	}

	if (side === MATCHUP_SIDE.away) {
		return away.title;
	}

	return MATCHUP_LABEL.neutral;
}

function advantageMark(advantage: MatchupSide): string {
	if (advantage === MATCHUP_SIDE.home) {
		return "A";
	}

	if (advantage === MATCHUP_SIDE.away) {
		return "B";
	}

	return "·";
}

function MetricRow({
	metric,
	homeTitle,
	awayTitle,
}: {
	metric: MatchupMetric;
	homeTitle: string;
	awayTitle: string;
}) {
	return (
		<li className="grid grid-cols-[7rem_1fr_1fr_2rem] items-center gap-2 text-xs sm:grid-cols-[8rem_1fr_1fr_2.5rem] sm:text-sm">
			<span className="font-medium text-fg-muted">
				{matchupMetricLabel(metric.key)}
			</span>
			<span className="tabular-nums text-fg">
				<span className="sr-only">{homeTitle} </span>
				{formatMatchupMetricValue(metric.key, metric.homeValue)}
			</span>
			<span className="tabular-nums text-fg">
				<span className="sr-only">{awayTitle} </span>
				{formatMatchupMetricValue(metric.key, metric.awayValue)}
			</span>
			<span
				className="text-center font-semibold text-pitch"
				title={matchupAdvantageTitle(metric.advantage, homeTitle, awayTitle)}
			>
				{advantageMark(metric.advantage)}
			</span>
		</li>
	);
}

function matchupAdvantageTitle(
	advantage: MatchupSide,
	homeTitle: string,
	awayTitle: string,
): string {
	if (advantage === MATCHUP_SIDE.home) {
		return homeTitle;
	}

	if (advantage === MATCHUP_SIDE.away) {
		return awayTitle;
	}

	return MATCHUP_LABEL.neutral;
}

function FavoriteStar() {
	return (
		<Star
			aria-hidden
			className="size-3.5 shrink-0 fill-amber-400 text-amber-400"
		/>
	);
}

function eventTeamBorderStyle(hex: string | null): { borderColor?: string } {
	if (hex === null) {
		return {};
	}

	return { borderColor: hex };
}

function keyPlayerHighlightWins(
	home: MatchupPlayerHighlight | null,
	away: MatchupPlayerHighlight | null,
	higherIsBetter: boolean,
): MatchupSide {
	if (home === null && away === null) {
		return MATCHUP_SIDE.neutral;
	}

	if (home === null) {
		return MATCHUP_SIDE.away;
	}

	if (away === null) {
		return MATCHUP_SIDE.home;
	}

	if (home.value === away.value) {
		return MATCHUP_SIDE.neutral;
	}

	if (higherIsBetter) {
		if (home.value > away.value) {
			return MATCHUP_SIDE.home;
		}

		return MATCHUP_SIDE.away;
	}

	if (home.value < away.value) {
		return MATCHUP_SIDE.home;
	}

	return MATCHUP_SIDE.away;
}

const KEY_PLAYER_ROWS = [
	{
		key: "scorer",
		label: MATCHUP_LABEL.scorer,
		formatValue: formatMatchupPerGame,
		higherIsBetter: true,
	},
	{
		key: "creator",
		label: MATCHUP_LABEL.creator,
		formatValue: formatMatchupPerGame,
		higherIsBetter: true,
	},
	{
		key: "goalkeeper",
		label: MATCHUP_LABEL.bestGoalkeeper,
		formatValue: formatMatchupPerGame,
		higherIsBetter: true,
	},
	{
		key: "cleanSheet",
		label: MATCHUP_LABEL.cleanSheetPlayer,
		formatValue: formatMatchupPercent,
		higherIsBetter: true,
	},
	{
		key: "goalsConceded",
		label: MATCHUP_LABEL.defensePlayer,
		formatValue: formatMatchupPerGame,
		higherIsBetter: false,
	},
	{
		key: "form",
		label: MATCHUP_LABEL.formPlayer,
		formatValue: formatMatchupPercent,
		higherIsBetter: true,
	},
] as const;

function KeyPlayerRow({
	label,
	player,
	isBest,
	formatValue,
}: {
	label: string;
	player: MatchupPlayerHighlight | null;
	isBest: boolean;
	formatValue: (value: number) => string;
}) {
	if (!player) {
		return (
			<li className="flex items-baseline justify-between gap-2 text-sm text-fg-subtle">
				<span>{label}</span>
				<span>—</span>
			</li>
		);
	}

	return (
		<li className="flex items-baseline justify-between gap-2 text-sm">
			<span className="text-fg-muted">{label}</span>
			<span className="flex min-w-0 items-center justify-end gap-1 text-right text-fg">
				{isBest && <FavoriteStar />}
				<span className="min-w-0 truncate">
					{player.name}{" "}
					<span className="tabular-nums text-fg-muted">
						({formatValue(player.value)})
					</span>
				</span>
			</span>
		</li>
	);
}

function KeyPlayersCard({
	title,
	color,
	players,
	wins,
	rows,
}: {
	title: string;
	color: string | null;
	players: MatchupTeamKeyPlayers;
	wins: Readonly<Record<(typeof KEY_PLAYER_ROWS)[number]["key"], boolean>>;
	rows: readonly (typeof KEY_PLAYER_ROWS)[number][];
}) {
	const style = eventTeamBorderStyle(color);
	const titleStyle = color === null ? undefined : { color };

	return (
		<div
			className="rounded-lg border-2 border-line bg-transparent p-3 text-sm"
			style={style}
		>
			<p className="mb-2 font-semibold text-fg" style={titleStyle}>
				{title}
			</p>
			<ul className="space-y-1">
				{rows.map((row) => (
					<KeyPlayerRow
						key={row.key}
						label={row.label}
						player={players[row.key]}
						isBest={wins[row.key]}
						formatValue={row.formatValue}
					/>
				))}
			</ul>
		</div>
	);
}

function KeyPlayersSection({
	home,
	away,
	keyPlayers,
}: {
	home: MatchupAnalysisTeamView;
	away: MatchupAnalysisTeamView;
	keyPlayers: MatchupAnalysis["keyPlayers"];
}) {
	const rows = KEY_PLAYER_ROWS.filter(
		(row) => keyPlayers.home[row.key] || keyPlayers.away[row.key],
	);

	const compared = rows.map((row) => {
		const winner = keyPlayerHighlightWins(
			keyPlayers.home[row.key],
			keyPlayers.away[row.key],
			row.higherIsBetter,
		);

		return {
			key: row.key,
			homeWins: winner === MATCHUP_SIDE.home,
			awayWins: winner === MATCHUP_SIDE.away,
		};
	});

	const homeWins = Object.fromEntries(
		compared.map((row) => [row.key, row.homeWins]),
	) as Record<(typeof KEY_PLAYER_ROWS)[number]["key"], boolean>;

	const awayWins = Object.fromEntries(
		compared.map((row) => [row.key, row.awayWins]),
	) as Record<(typeof KEY_PLAYER_ROWS)[number]["key"], boolean>;

	return (
		<div>
			<p className="mb-1 text-xs font-semibold uppercase tracking-wide text-fg-muted">
				{MATCHUP_LABEL.keyPlayers}
			</p>
			<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
				<KeyPlayersCard
					title={home.title}
					color={home.color}
					players={keyPlayers.home}
					wins={homeWins}
					rows={rows}
				/>
				<KeyPlayersCard
					title={away.title}
					color={away.color}
					players={keyPlayers.away}
					wins={awayWins}
					rows={rows}
				/>
			</div>
		</div>
	);
}

function formatNullablePerGame(value: number | null): string {
	if (value === null) {
		return MATCHUP_LABEL.insufficient;
	}

	return formatMatchupPerGame(value);
}

function formatNullablePercent(value: number | null): string {
	if (value === null) {
		return MATCHUP_LABEL.insufficient;
	}

	return formatMatchupPercent(value);
}

function goalkeeperLine(name: string | null, rating: number | null): string {
	if (name === null) {
		return MATCHUP_LABEL.noGoalkeeper;
	}

	if (rating === null) {
		return `${name} · ${MATCHUP_LABEL.insufficient}`;
	}

	return `${name} · ${formatMatchupPerGame(rating)}`;
}

function AttackCard({
	title,
	color,
	detail,
}: {
	title: string;
	color: string | null;
	detail: MatchupAnalysis["home"];
}) {
	const borderStyle = eventTeamBorderStyle(color);
	const titleStyle = color === null ? undefined : { color };

	return (
		<div
			className="rounded-lg border-2 border-line bg-transparent p-3 text-sm"
			style={borderStyle}
		>
			<p className="mb-2 font-semibold text-fg" style={titleStyle}>
				{title}
			</p>
			<ul className="space-y-1 text-xs text-fg-muted sm:text-sm">
				<li>
					{MATCHUP_LABEL.goalsPerGame}:{" "}
					<span className="tabular-nums text-fg">
						{formatNullablePerGame(detail.goalsPerGame)}
					</span>
				</li>
				<li>
					{MATCHUP_LABEL.assistsPerGame}:{" "}
					<span className="tabular-nums text-fg">
						{formatNullablePerGame(detail.assistsPerGame)}
					</span>
				</li>
				<li>
					{MATCHUP_LABEL.goalShare}:{" "}
					<span className="tabular-nums text-fg">
						{formatNullablePercent(detail.goalShare)}
					</span>
				</li>
			</ul>
		</div>
	);
}

function DefenseCard({
	title,
	color,
	detail,
}: {
	title: string;
	color: string | null;
	detail: MatchupAnalysis["home"];
}) {
	const borderStyle = eventTeamBorderStyle(color);
	const titleStyle = color === null ? undefined : { color };

	return (
		<div
			className="rounded-lg border-2 border-line bg-transparent p-3 text-sm"
			style={borderStyle}
		>
			<p className="mb-2 font-semibold text-fg" style={titleStyle}>
				{title}
			</p>
			<ul className="space-y-1 text-xs text-fg-muted sm:text-sm">
				<li>
					{MATCHUP_LABEL.goalsConcededPerGame}:{" "}
					<span className="tabular-nums text-fg">
						{formatNullablePerGame(detail.goalsConcededPerGame)}
					</span>
				</li>
				<li>
					{MATCHUP_LABEL.cleanSheetRate}:{" "}
					<span className="tabular-nums text-fg">
						{formatNullablePercent(detail.cleanSheetRate)}
					</span>
				</li>
				<li>
					{MATCHUP_LABEL.goalkeeper}:{" "}
					<span className="text-fg">
						{goalkeeperLine(detail.goalkeeperName, detail.goalkeeperRating)}
					</span>
				</li>
			</ul>
		</div>
	);
}

function FactorBlock({
	title,
	factor,
	analysis,
	home,
	away,
}: {
	title: string;
	factor: MatchupMetricKey | typeof MATCHUP_SIDE.neutral;
	analysis: MatchupAnalysis;
	home: MatchupAnalysisTeamView;
	away: MatchupAnalysisTeamView;
}) {
	if (factor === MATCHUP_SIDE.neutral) {
		return null;
	}

	const metric = analysis.metrics.find((row) => row.key === factor);
	if (!metric || metric.advantage === MATCHUP_SIDE.neutral) {
		return null;
	}

	return (
		<div className="rounded-lg border border-line bg-surface-muted/40 p-3 text-sm">
			<p className="font-semibold text-fg">{title}</p>
			<p className="mt-1 text-fg-muted">
				{matchupMetricLabel(factor)} · {sideTitle(metric.advantage, home, away)}
			</p>
			<p className="mt-1 tabular-nums text-fg">
				{formatMatchupMetricValue(factor, metric.homeValue)} ×{" "}
				{formatMatchupMetricValue(factor, metric.awayValue)}
			</p>
		</div>
	);
}

function favoriteTeamView(
	favoriteSide: MatchupSide,
	home: MatchupAnalysisTeamView,
	away: MatchupAnalysisTeamView,
): MatchupAnalysisTeamView | null {
	if (favoriteSide === MATCHUP_SIDE.home) {
		return home;
	}

	if (favoriteSide === MATCHUP_SIDE.away) {
		return away;
	}

	return null;
}

export function MatchupAnalysisPanel({
	analysis,
	home,
	away,
	footer = null,
}: {
	analysis: MatchupAnalysis;
	home: MatchupAnalysisTeamView;
	away: MatchupAnalysisTeamView;
	footer?: ReactNode;
}) {
	const favoriteTeam = favoriteTeamView(analysis.favoriteSide, home, away);
	const favoriteColor = favoriteTeam?.color ?? null;
	const favoriteBorder = eventTeamBorderStyle(favoriteColor);
	const favoriteNameStyle =
		favoriteColor === null ? undefined : { color: favoriteColor };

	return (
		<div className="space-y-3">
			<div
				className="rounded-lg border-2 border-pitch/30 bg-transparent p-3 text-center"
				style={favoriteBorder}
			>
				<p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
					{MATCHUP_LABEL.favoriteByRating}
				</p>
				<p
					className="mt-1 text-base font-semibold text-pitch"
					style={favoriteNameStyle}
				>
					{sideTitle(analysis.favoriteSide, home, away)}
				</p>
				<p className="mt-1 text-xs text-fg-muted">
					{matchupBalanceLabel(analysis.balanceLevel)}
				</p>
			</div>

			<div>
				<div className="mb-1 grid grid-cols-[7rem_1fr_1fr_2rem] gap-2 text-[0.65rem] font-medium uppercase tracking-wide text-fg-subtle sm:grid-cols-[8rem_1fr_1fr_2.5rem] sm:text-xs">
					<span />
					<span className="truncate">{home.title}</span>
					<span className="truncate">{away.title}</span>
					<span className="text-center">±</span>
				</div>
				<ul className="space-y-1.5">
					{analysis.metrics
						.filter((metric) => metric.key !== MATCHUP_METRIC.rating)
						.map((metric) => (
							<MetricRow
								key={metric.key}
								metric={metric}
								homeTitle={home.title}
								awayTitle={away.title}
							/>
						))}
				</ul>
			</div>

			<div>
				<p className="mb-1 text-xs font-semibold uppercase tracking-wide text-fg-muted">
					{MATCHUP_LABEL.attackFactor}
				</p>
				<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
					<AttackCard
						title={home.title}
						color={home.color}
						detail={analysis.home}
					/>
					<AttackCard
						title={away.title}
						color={away.color}
						detail={analysis.away}
					/>
				</div>
			</div>

			<div>
				<p className="mb-1 text-xs font-semibold uppercase tracking-wide text-fg-muted">
					{MATCHUP_LABEL.defenseFactor}
				</p>
				<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
					<DefenseCard
						title={home.title}
						color={home.color}
						detail={analysis.home}
					/>
					<DefenseCard
						title={away.title}
						color={away.color}
						detail={analysis.away}
					/>
				</div>
			</div>

			{matchupHasKeyPlayers(analysis.keyPlayers) && (
				<KeyPlayersSection
					home={home}
					away={away}
					keyPlayers={analysis.keyPlayers}
				/>
			)}

			<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
				<FactorBlock
					title={MATCHUP_LABEL.decisive}
					factor={analysis.decisiveFactor}
					analysis={analysis}
					home={home}
					away={away}
				/>
				<FactorBlock
					title={MATCHUP_LABEL.warning}
					factor={analysis.warningFactor}
					analysis={analysis}
					home={home}
					away={away}
				/>
			</div>

			{footer}
		</div>
	);
}

export function EventMatchupAnalysis({
	teams,
	historyEvents,
	roster,
}: EventMatchupAnalysisProps) {
	const eligible = useMemo(
		() => teams.filter((team) => team.playerIds.length > 0),
		[teams],
	);

	const defaultPair = useMemo(
		() => defaultMatchupPairKeys(eligible),
		[eligible],
	);

	const [homeKey, setHomeKey] = useState(defaultPair?.homeKey ?? "");
	const [awayKey, setAwayKey] = useState(defaultPair?.awayKey ?? "");

	useEffect(() => {
		if (!defaultPair) {
			return;
		}

		setHomeKey(defaultPair.homeKey);
		setAwayKey(defaultPair.awayKey);
	}, [defaultPair]);

	const home = eligible.find((team) => team.teamKey === homeKey) ?? null;
	const away = eligible.find((team) => team.teamKey === awayKey) ?? null;
	const showPicker = eligible.length > 2;

	const analysis = useMemo(() => {
		if (!home || !away || home.teamKey === away.teamKey) {
			return null;
		}

		return analyzeEventMatchup({
			home,
			away,
			historyEvents,
			roster,
		});
	}, [home, away, historyEvents, roster]);

	if (!defaultPair || !home || !away) {
		return null;
	}

	return (
		<section
			className="mx-auto w-full max-w-3xl space-y-3 rounded-xl border border-line bg-surface p-3 sm:p-4"
			aria-label={MATCHUP_LABEL.title}
		>
			<header className="space-y-1">
				<h2 className="text-base font-semibold text-fg sm:text-lg">
					{MATCHUP_LABEL.title}
				</h2>
			</header>

			{showPicker && (
				<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
					<label className="block text-xs font-medium text-fg-muted">
						{MATCHUP_LABEL.teamA}
						<select
							className={`${FIELD_CLASS} mt-1`}
							value={homeKey}
							onChange={(event) => {
								const next = event.target.value;
								setHomeKey(next);
								if (next === awayKey) {
									const fallback = eligible.find(
										(team) => team.teamKey !== next,
									);
									if (fallback) {
										setAwayKey(fallback.teamKey);
									}
								}
							}}
						>
							{eligible.map((team) => (
								<option key={team.teamKey} value={team.teamKey}>
									{team.title}
								</option>
							))}
						</select>
					</label>
					<label className="block text-xs font-medium text-fg-muted">
						{MATCHUP_LABEL.teamB}
						<select
							className={`${FIELD_CLASS} mt-1`}
							value={awayKey}
							onChange={(event) => {
								const next = event.target.value;
								setAwayKey(next);
								if (next === homeKey) {
									const fallback = eligible.find(
										(team) => team.teamKey !== next,
									);
									if (fallback) {
										setHomeKey(fallback.teamKey);
									}
								}
							}}
						>
							{eligible.map((team) => (
								<option key={team.teamKey} value={team.teamKey}>
									{team.title}
								</option>
							))}
						</select>
					</label>
				</div>
			)}

			{!showPicker && (
				<p className="text-sm text-fg-muted">
					{home.title} × {away.title}
				</p>
			)}

			{analysis && (
				<MatchupAnalysisPanel analysis={analysis} home={home} away={away} />
			)}
		</section>
	);
}
