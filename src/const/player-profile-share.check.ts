import type { ChampionshipPlayer } from "../types/championship.ts";
import type { PlayerProfileHistoryRow } from "./player-profile.ts";
import {
	PLAYER_PROFILE_SHARE_LABEL,
	playerProfileShareCard,
	playerProfileShareFileName,
	playerProfileShareText,
} from "./player-profile-share.ts";
import { toRosterRow } from "./roster-stats.ts";

function check(actual: unknown, expected: unknown): void {
	if (actual !== expected) {
		throw new Error(`expected ${String(expected)}, got ${String(actual)}`);
	}
}

const player: ChampionshipPlayer = {
	id: 7,
	championship_id: 1,
	user_id: "u-1",
	display_name: "Ana Souza",
	nickname: "Nena",
	avatar_url: "https://example.com/ana.png",
	rating: 8,
	role: "captain",
	is_goalkeeper: false,
	deleted_at: null,
	goals: 4,
	assists: 2,
	assisted_goals: 3,
	own_goals: 1,
	wins: 3,
	losses: 2,
	draws: 1,
	matches: 6,
	mvps: 1,
};

const guest: ChampionshipPlayer = {
	...player,
	id: 8,
	user_id: null,
	nickname: null,
	display_name: "Bruno",
	role: "member",
};

const nowIso = "2026-08-14T13:00:00.000Z";
const history: readonly PlayerProfileHistoryRow[] = [
	{
		eventId: 4,
		championshipId: 1,
		startsAt: "2026-08-07T22:00:00.000Z",
		goals: 1,
		assists: 0,
		assistedGoals: 1,
		ownGoals: 0,
		wins: 1,
		losses: 0,
		draws: 0,
		mvps: 1,
		matches: 1,
		ratingFrom: 7,
		ratingDelta: 1,
		ratingTo: 8,
	},
];

const card = playerProfileShareCard(
	player,
	toRosterRow(player),
	"owner-1",
	"Baba do Mago",
	history,
	nowIso,
);

check(card.name, "Nena");
check(card.legalName, "Ana Souza");
check(card.roleLabel, "Capitão");
check(card.championshipName, "Baba do Mago");
check(card.rating, 8);
check(card.avatarUrl, player.avatar_url);
check(card.stats[0]?.abbr, "G");
check(card.stats[0]?.value, "4");
check(card.stats[2]?.abbr, "GS");
check(card.stats[2]?.value, "3");
check(card.chart.length, 2);
check(card.chart[0]?.startsAt, history[0]?.startsAt);
check(card.chart[0]?.rating, 8);
check(card.chart[1]?.startsAt, nowIso);
check(card.chart[1]?.rating, 8);
check(PLAYER_PROFILE_SHARE_LABEL.chart, "Evolução");
check(
	playerProfileShareFileName({
		championshipName: "Baba do Mago",
		name: card.name,
		playerId: card.playerId,
		generatedAt: nowIso,
	}),
	"perfil-baba-do-mago-nena-14-08-2026.png",
);
check(
	playerProfileShareFileName({
		championshipName: "",
		name: "",
		playerId: 7,
		generatedAt: nowIso,
	}),
	"perfil-7-14-08-2026.png",
);
check(
	playerProfileShareText(card).startsWith("Nena\nBaba do Mago\nCapitão\nG 4"),
	true,
);

const guestCard = playerProfileShareCard(
	guest,
	toRosterRow(guest),
	"owner-1",
	"Baba",
	[],
	nowIso,
);
check(guestCard.chart.length, 0);
check(guestCard.name, "Bruno");
check(guestCard.legalName, null);
check(guestCard.roleLabel, "Sem conta");
check(
	playerProfileShareFileName({
		championshipName: "Baba",
		name: "João Ñoño",
		playerId: 1,
		generatedAt: nowIso,
	}),
	"perfil-baba-joao-nono-14-08-2026.png",
);
