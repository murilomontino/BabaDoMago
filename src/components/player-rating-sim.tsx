import { useState } from "react";
import { PlayerRating } from "@/components/player-rating";
import { parseAttendanceStatInput } from "@/const/championship-event";
import { formatEventRating } from "@/const/event-rating-adjustment";
import { PLAYER_RATING } from "@/const/player-rating";
import {
	emptyPlayerRatingSimDraft,
	formatPlayerRatingSimRate,
	PLAYER_RATING_SIM_FIELDS,
	PLAYER_RATING_SIM_LABEL,
	type PlayerRatingSimFieldId,
	setPlayerRatingSimField,
	simulatePlayerEventRating,
} from "@/const/player-rating-sim";
import { CHIP_CLASS, STAT_FIELD_CLASS } from "@/const/ui";

type PlayerRatingSimProps = {
	rating: number;
	ceiling: number;
};

function RatingSnapshot({
	rating,
	ceiling,
}: {
	rating: number;
	ceiling: number;
}) {
	return (
		<div className="flex items-center justify-center gap-2">
			<PlayerRating rating={rating} ceiling={ceiling} />
			<span className={CHIP_CLASS}>{formatEventRating(rating)}</span>
		</div>
	);
}

export function PlayerRatingSim({ rating, ceiling }: PlayerRatingSimProps) {
	const [draft, setDraft] = useState(emptyPlayerRatingSimDraft);
	const [isMvp, setIsMvp] = useState(false);
	const result = simulatePlayerEventRating({
		rating,
		wins: draft.wins,
		draws: draft.draws,
		losses: draft.losses,
		ceiling,
		isMvp,
	});

	return (
		<div className="space-y-4">
			<p className="text-sm text-fg-muted">{PLAYER_RATING_SIM_LABEL.hint}</p>
			<div className="grid grid-cols-3 gap-3">
				{PLAYER_RATING_SIM_FIELDS.map((field) => {
					const inputId = `player-rating-sim-${field.id}`;

					return (
						<label
							key={field.id}
							htmlFor={inputId}
							className="flex flex-col items-center gap-1.5 text-xs font-medium text-fg-muted"
						>
							<span title={field.label}>{field.abbr}</span>
							<input
								id={inputId}
								type="number"
								min={0}
								step={1}
								inputMode="numeric"
								value={draft[field.id]}
								className={STAT_FIELD_CLASS}
								onChange={(event) => {
									const next = parseAttendanceStatInput(event.target.value);
									if (next === null) {
										return;
									}

									setDraft((current) =>
										setPlayerRatingSimField(
											current,
											field.id as PlayerRatingSimFieldId,
											next,
										),
									);
								}}
							/>
						</label>
					);
				})}
			</div>
			<label className="flex items-center gap-2 text-sm text-fg">
				<input
					type="checkbox"
					checked={isMvp}
					className="size-4 rounded border-line"
					onChange={(event) => {
						setIsMvp(event.target.checked);
					}}
				/>
				{PLAYER_RATING_SIM_LABEL.mvp}
			</label>
			<dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
				<div>
					<dt className="text-fg-muted">{PLAYER_RATING_SIM_LABEL.matches}</dt>
					<dd className="font-medium tabular-nums text-fg">{result.matches}</dd>
				</div>
				<div>
					<dt className="text-fg-muted">{PLAYER_RATING_SIM_LABEL.ceiling}</dt>
					<dd className="font-medium tabular-nums text-fg">
						{formatEventRating(ceiling)}
					</dd>
				</div>
				<div>
					<dt className="text-fg-muted">{PLAYER_RATING_SIM_LABEL.floor}</dt>
					<dd className="font-medium tabular-nums text-fg">
						{formatEventRating(PLAYER_RATING.floor)}
					</dd>
				</div>
				<div>
					<dt className="text-fg-muted">{PLAYER_RATING_SIM_LABEL.rate}</dt>
					<dd className="font-medium tabular-nums text-fg">
						{formatPlayerRatingSimRate(result.rate)}
					</dd>
				</div>
				<div>
					<dt className="text-fg-muted">{PLAYER_RATING_SIM_LABEL.drawPoints}</dt>
					<dd className="font-medium tabular-nums text-fg">
						{result.drawPoints}
					</dd>
				</div>
				<div>
					<dt className="text-fg-muted">{PLAYER_RATING_SIM_LABEL.delta}</dt>
					<dd className="font-medium tabular-nums text-fg">
						{formatEventRating(result.delta)}
					</dd>
				</div>
			</dl>
			{result.drawPoints > 1 && (
				<p className="text-xs text-fg-muted">{PLAYER_RATING_SIM_LABEL.drawBonus}</p>
			)}
			{result.belowMinMatches && (
				<p className="text-xs text-fg-muted">
					{PLAYER_RATING_SIM_LABEL.belowMinMatches}
				</p>
			)}
			{result.inDeadZone && !result.belowMinMatches && !result.isSeed && (
				<p className="text-xs text-fg-muted">{PLAYER_RATING_SIM_LABEL.deadZone}</p>
			)}
			{result.isSeed && (
				<p className="text-xs text-fg-muted">{PLAYER_RATING_SIM_LABEL.seed}</p>
			)}
			<div className="flex flex-wrap items-center justify-center gap-3">
				<div className="text-center">
					<p className="mb-1 text-xs text-fg-muted">
						{PLAYER_RATING_SIM_LABEL.from}
					</p>
					<RatingSnapshot rating={result.from} ceiling={ceiling} />
				</div>
				<span className="text-sm font-bold text-fg">→</span>
				<div className="text-center">
					<p className="mb-1 text-xs text-fg-muted">
						{PLAYER_RATING_SIM_LABEL.to}
					</p>
					<RatingSnapshot rating={result.to} ceiling={ceiling} />
				</div>
			</div>
		</div>
	);
}
