import { useEffect, useMemo, useState } from "react";
import {
	analyzeEventMatchup,
	defaultMatchupPairKeys,
	formatMatchupMetricValue,
	formatMatchupPercent,
	formatMatchupPerGame,
	formatMatchupRating,
	MATCHUP_LABEL,
	MATCHUP_SIDE,
	type MatchupAnalysis,
	type MatchupMetric,
	type MatchupMetricKey,
	type MatchupSide,
	type MatchupTeamInput,
	matchupBalanceLabel,
	matchupMetricLabel,
} from "@/const/event-matchup-analysis";
import { eventTeamColorStyle } from "@/const/event-team-color";
import { FIELD_CLASS } from "@/const/ui";
import type { ChampionshipPlayer } from "@/types/championship";
import type { ChampionshipEvent } from "@/types/championship-event";

type EventMatchupAnalysisProps = {
	teams: readonly MatchupTeamInput[];
	historyEvents: readonly ChampionshipEvent[];
	roster: readonly ChampionshipPlayer[];
};

function sideTitle(
	side: MatchupSide,
	home: MatchupTeamInput,
	away: MatchupTeamInput,
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

function AttackCard({
	title,
	color,
	detail,
}: {
	title: string;
	color: string | null;
	detail: MatchupAnalysis["home"];
}) {
	const style = eventTeamColorStyle(color);

	return (
		<div
			className="rounded-lg border border-line bg-surface p-3 text-sm"
			style={style}
		>
			<p className="mb-2 font-semibold text-fg">{title}</p>
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
	const style = eventTeamColorStyle(color);

	return (
		<div
			className="rounded-lg border border-line bg-surface p-3 text-sm"
			style={style}
		>
			<p className="mb-2 font-semibold text-fg">{title}</p>
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

function KeyPlayerRow({
	label,
	name,
	value,
	formatValue,
}: {
	label: string;
	name: string;
	value: number;
	formatValue: (value: number) => string;
}) {
	return (
		<li className="flex items-baseline justify-between gap-2 text-sm">
			<span className="text-fg-muted">{label}</span>
			<span className="min-w-0 truncate text-right text-fg">
				{name}{" "}
				<span className="tabular-nums text-fg-muted">
					({formatValue(value)})
				</span>
			</span>
		</li>
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
	home: MatchupTeamInput;
	away: MatchupTeamInput;
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

function FavoriteFieldWins({
	fieldWins,
}: {
	fieldWins: { home: number; away: number };
}) {
	return (
		<>
			{" "}
			({fieldWins.home}×{fieldWins.away} campos)
		</>
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
				{analysis && (
					<p className="text-xs text-fg-muted sm:text-sm">
						{matchupBalanceLabel(analysis.balanceLevel)}
					</p>
				)}
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
				<>
					<div className="rounded-lg border border-pitch/30 bg-pitch/5 p-3 text-center">
						<p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
							{MATCHUP_LABEL.favoriteByFields}
						</p>
						<p className="mt-1 text-base font-semibold text-fg">
							{sideTitle(analysis.favoriteSide, home, away)}
						</p>
						<p className="mt-1 text-sm tabular-nums text-fg-muted">
							{MATCHUP_LABEL.rating}:{" "}
							{formatMatchupRating(analysis.home.ratingAverage)} ×{" "}
							{formatMatchupRating(analysis.away.ratingAverage)}
							<FavoriteFieldWins fieldWins={analysis.fieldWins} />
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
							{analysis.metrics.map((metric) => (
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

					{(analysis.keyPlayers.scorer ||
						analysis.keyPlayers.creator ||
						analysis.keyPlayers.goalkeeper ||
						analysis.keyPlayers.form) && (
						<div className="rounded-lg border border-line p-3">
							<p className="mb-2 text-sm font-semibold text-fg">
								{MATCHUP_LABEL.keyPlayers}
							</p>
							<ul className="space-y-1">
								{analysis.keyPlayers.scorer && (
									<KeyPlayerRow
										label={MATCHUP_LABEL.scorer}
										name={analysis.keyPlayers.scorer.name}
										value={analysis.keyPlayers.scorer.value}
										formatValue={formatMatchupPerGame}
									/>
								)}
								{analysis.keyPlayers.creator && (
									<KeyPlayerRow
										label={MATCHUP_LABEL.creator}
										name={analysis.keyPlayers.creator.name}
										value={analysis.keyPlayers.creator.value}
										formatValue={formatMatchupPerGame}
									/>
								)}
								{analysis.keyPlayers.goalkeeper && (
									<KeyPlayerRow
										label={MATCHUP_LABEL.bestGoalkeeper}
										name={analysis.keyPlayers.goalkeeper.name}
										value={analysis.keyPlayers.goalkeeper.value}
										formatValue={formatMatchupPerGame}
									/>
								)}
								{analysis.keyPlayers.form && (
									<KeyPlayerRow
										label={MATCHUP_LABEL.formPlayer}
										name={analysis.keyPlayers.form.name}
										value={analysis.keyPlayers.form.value}
										formatValue={formatMatchupPercent}
									/>
								)}
							</ul>
						</div>
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

					<div className="rounded-lg border border-line p-3 text-sm">
						<p className="font-semibold text-fg">{MATCHUP_LABEL.summary}</p>
						<p className="mt-1 text-fg">{analysis.summary.favoriteLine}</p>
						{analysis.summary.decisiveLine && (
							<p className="mt-1 text-fg-muted">
								{analysis.summary.decisiveLine}
							</p>
						)}
						{analysis.summary.warningLine && (
							<p className="mt-1 text-fg-muted">
								{analysis.summary.warningLine}
							</p>
						)}
					</div>
				</>
			)}
		</section>
	);
}
