import { EVENT_DRAW_REVEAL } from "../const/event-draw-reveal.ts";
import type { EventTeamShareCard } from "../const/event-team-share.ts";
import { EVENT_DRAW_AUDIO_TRACK } from "./event-draw-audio-track.ts";
import {
	EVENT_DRAW_VIDEO_CONFIG,
	eventDrawCompleteTimeSec,
	eventDrawOutroStartSec,
	eventDrawPotRevealTimesSec,
	eventDrawPotsDurationSec,
	eventDrawRevealTimesSec,
	eventDrawTotalDurationSec,
	eventDrawTotalPlayers,
} from "./event-draw-video-timeline.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(EVENT_DRAW_VIDEO_CONFIG.width === 540, "largura 540px (9:16)");
check(EVENT_DRAW_VIDEO_CONFIG.height === 960, "altura 960px (9:16)");
check(EVENT_DRAW_VIDEO_CONFIG.fps === 30, "30 fps");
check(
	EVENT_DRAW_VIDEO_CONFIG.playerRevealSec ===
		EVENT_DRAW_REVEAL.itemDelayMs / 1000,
	"ritmo do video igual ao da tela ao vivo",
);

function card(title: string, ratings: number[]): EventTeamShareCard {
	return {
		title,
		color: null,
		players: ratings.map((rating, index) => ({
			id: index + 1,
			number: index + 1,
			name: `Jogador ${index + 1}`,
			rating,
			avatarUrl: null,
		})),
	};
}

const cards = [card("Time 1", [3, 3, 3]), card("Time 2", [3, 3])];

check(eventDrawTotalPlayers(cards) === 5, "conta todos os jogadores");

const times = eventDrawRevealTimesSec(cards);
check(times.length === 5, "uma revelacao por jogador");
check(
	times[0] === EVENT_DRAW_VIDEO_CONFIG.introDurationSec,
	"primeira revelacao logo apos a intro",
);
check(
	times[1] ===
		EVENT_DRAW_VIDEO_CONFIG.introDurationSec +
			EVENT_DRAW_VIDEO_CONFIG.playerRevealSec,
	"revelacoes espacadas pelo delay da tela",
);

check(
	eventDrawCompleteTimeSec(cards) === times.at(-1),
	"acorde final no ultimo jogador, como na tela",
);
check(
	eventDrawOutroStartSec(cards) ===
		EVENT_DRAW_VIDEO_CONFIG.introDurationSec +
			5 * EVENT_DRAW_VIDEO_CONFIG.playerRevealSec,
	"fecho comeca depois da ultima revelacao",
);
check(
	eventDrawTotalDurationSec(cards) ===
		eventDrawOutroStartSec(cards) + EVENT_DRAW_VIDEO_CONFIG.outroDurationSec,
	"duracao total inclui o fecho",
);
check(
	eventDrawCompleteTimeSec([]) === null,
	"sem jogadores nao ha acorde final",
);
check(eventDrawPotsDurationSec(0) === 0, "sem potes nao alonga o video");
check(
	eventDrawPotsDurationSec(2) === 2 * EVENT_DRAW_VIDEO_CONFIG.playerRevealSec,
	"cada pote usa o mesmo delay da tela",
);
check(
	eventDrawRevealTimesSec(cards, 2)[0] ===
		EVENT_DRAW_VIDEO_CONFIG.introDurationSec + eventDrawPotsDurationSec(2),
	"times comecam depois dos potes",
);
check(
	eventDrawPotRevealTimesSec(2)[0] === EVENT_DRAW_VIDEO_CONFIG.introDurationSec,
	"primeiro pote logo apos a intro",
);
check(
	EVENT_DRAW_AUDIO_TRACK.sampleRate === 48_000 &&
		EVENT_DRAW_AUDIO_TRACK.channels === 1,
	"trilha mono 48kHz para o AAC",
);

console.log("event-draw-video ok");
