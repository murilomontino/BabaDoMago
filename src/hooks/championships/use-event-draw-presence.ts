import { useEffect, useState } from "react";
import {
	type EventDrawViewer,
	eventDrawRevealChannelName,
	eventDrawRevealViewersFromPresence,
} from "@/const/event-draw-reveal";
import { playerVisibleName } from "@/const/player-name";
import { supabase } from "@/lib/supabase";
import type { ChampionshipPlayer } from "@/types/championship";

export function useEventDrawPresence(
	eventId: number,
	player: ChampionshipPlayer | null,
	userId: string | null,
): EventDrawViewer[] {
	const [viewers, setViewers] = useState<EventDrawViewer[]>([]);
	const playerId = player?.id ?? null;
	const displayName = player ? playerVisibleName(player) : null;
	const avatarUrl = player?.avatar_url ?? null;

	useEffect(() => {
		if (!Number.isFinite(eventId)) {
			return;
		}

		if (playerId === null && !userId) {
			return;
		}

		const presenceKey = playerId === null ? `user:${userId}` : String(playerId);
		const channel = supabase.channel(eventDrawRevealChannelName(eventId), {
			config: { presence: { key: presenceKey } },
		});

		function syncViewers() {
			setViewers(
				eventDrawRevealViewersFromPresence(
					channel.presenceState() as Record<
						string,
						readonly Record<string, unknown>[]
					>,
				),
			);
		}

		channel
			.on("presence", { event: "sync" }, syncViewers)
			.on("presence", { event: "join" }, syncViewers)
			.on("presence", { event: "leave" }, syncViewers)
			.subscribe((status) => {
				if (status !== "SUBSCRIBED") {
					return;
				}

				if (playerId === null || displayName === null) {
					return;
				}

				void channel.track({
					playerId,
					displayName,
					avatarUrl,
				});
			});

		return () => {
			setViewers([]);
			void supabase.removeChannel(channel);
		};
	}, [avatarUrl, displayName, eventId, playerId, userId]);

	return viewers;
}
