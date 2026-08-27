import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth";
import {
	addManualPlayers,
	claimPlayer,
	createChampionship,
	deactivatePlayer,
	deleteChampionship,
	getChampionshipById,
	getChampionshipByInvite,
	joinChampionship,
	listChampionships,
	mergeChampionshipPlayers,
	reactivatePlayer,
	removePlayer,
	renameChampionship,
	setPlayerIsGoalkeeper,
	setPlayerRole,
	transferChampionshipOwner,
	unlinkPlayer,
	updateChampionshipEventConfig,
	updateChampionshipVisibility,
	updatePlayerNickname,
	updatePlayerRating,
	uploadChampionshipLogo,
} from "@/services/championships";
import type { ChampionshipWithPlayers } from "@/types/championship";
import {
	CHAMPIONSHIP_BY_ID_QUERY_KEY,
	CHAMPIONSHIP_BY_INVITE_QUERY_KEY,
	CHAMPIONSHIPS_QUERY_KEY,
	invalidateChampionshipEventQueries,
	invalidateChampionshipQueries,
	withChampionshipPlayerGoalkeeper,
} from "./championships-query-keys";

export function useChampionships() {
	const { user } = useAuth();

	return useQuery({
		queryKey: [...CHAMPIONSHIPS_QUERY_KEY, user?.id],
		queryFn: () => listChampionships(user?.id ?? ""),
	});
}

export function useChampionship(championshipId: number) {
	const { user } = useAuth();

	return useQuery({
		queryKey: [...CHAMPIONSHIP_BY_ID_QUERY_KEY, championshipId, user?.id],
		queryFn: () => getChampionshipById(championshipId),
		enabled: Number.isFinite(championshipId) && Boolean(user),
	});
}

export function useChampionshipByInvite(inviteCode: string) {
	return useQuery({
		queryKey: [...CHAMPIONSHIP_BY_INVITE_QUERY_KEY, inviteCode],
		queryFn: () => getChampionshipByInvite(inviteCode),
		enabled: inviteCode.length > 0,
	});
}

export function useCreateChampionship() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			name,
			userId,
			displayName,
			avatarUrl,
		}: {
			name: string;
			userId: string;
			displayName: string;
			avatarUrl: string | null;
		}) => createChampionship(name, userId, displayName, avatarUrl),
		onSuccess: async () => {
			await invalidateChampionshipQueries(queryClient);
		},
	});
}

export function useAddManualPlayer(championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			displayNames,
			rating,
			isGoalkeeper,
		}: {
			displayNames: string[];
			rating: number;
			isGoalkeeper: boolean;
		}) => addManualPlayers(championshipId, displayNames, rating, isGoalkeeper),
		onSuccess: async () => {
			await invalidateChampionshipQueries(queryClient);
		},
	});
}

export function useJoinChampionship(inviteCode: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => joinChampionship(inviteCode),
		onSuccess: async () => {
			await invalidateChampionshipQueries(queryClient);
		},
	});
}

export function useClaimPlayer() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (playerId: number) => claimPlayer(playerId),
		onSuccess: async () => {
			await invalidateChampionshipQueries(queryClient);
		},
	});
}

export function useUpdatePlayerRating() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ playerId, rating }: { playerId: number; rating: number }) =>
			updatePlayerRating(playerId, rating),
		onSuccess: async () => {
			await invalidateChampionshipQueries(queryClient);
		},
	});
}

export function useUpdatePlayerNickname() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			playerId,
			nickname,
			nicknameTags,
		}: {
			playerId: number;
			nickname: string;
			nicknameTags: string[];
		}) => updatePlayerNickname(playerId, nickname, nicknameTags),
		onSuccess: async () => {
			await invalidateChampionshipQueries(queryClient);
		},
	});
}

export function useRenameChampionship(championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (name: string) => renameChampionship(championshipId, name),
		onSuccess: async () => {
			await invalidateChampionshipQueries(queryClient);
		},
	});
}

export function useUpdateChampionshipEventConfig(championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			eventTime,
			playersPerTeam,
			skipGuestGoalkeeperMatches,
			eventWeekday,
			location,
		}: {
			eventTime: string;
			playersPerTeam: number;
			skipGuestGoalkeeperMatches: boolean;
			eventWeekday: number | null;
			location: string | null;
		}) =>
			updateChampionshipEventConfig(
				championshipId,
				eventTime,
				playersPerTeam,
				skipGuestGoalkeeperMatches,
				eventWeekday,
				location,
			),
		onSuccess: async () => {
			await invalidateChampionshipQueries(queryClient);
		},
	});
}

export function useUpdateChampionshipVisibility(championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (isVisible: boolean) =>
			updateChampionshipVisibility(championshipId, isVisible),
		onSuccess: async () => {
			await invalidateChampionshipQueries(queryClient);
		},
	});
}

export function useSetPlayerRole() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ playerId, role }: { playerId: number; role: string }) =>
			setPlayerRole(playerId, role),
		onSuccess: async () => {
			await invalidateChampionshipQueries(queryClient);
		},
	});
}

export function useSetPlayerIsGoalkeeper() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			playerId,
			isGoalkeeper,
		}: {
			playerId: number;
			isGoalkeeper: boolean;
		}) => setPlayerIsGoalkeeper(playerId, isGoalkeeper),
		onMutate: ({ playerId, isGoalkeeper }) => {
			const previous = queryClient.getQueriesData<ChampionshipWithPlayers>({
				queryKey: CHAMPIONSHIP_BY_ID_QUERY_KEY,
			});
			void queryClient.cancelQueries({
				queryKey: CHAMPIONSHIP_BY_ID_QUERY_KEY,
			});
			queryClient.setQueriesData<ChampionshipWithPlayers>(
				{ queryKey: CHAMPIONSHIP_BY_ID_QUERY_KEY },
				(data) => {
					if (!data) {
						return data;
					}

					return withChampionshipPlayerGoalkeeper(data, playerId, isGoalkeeper);
				},
			);
			return { previous };
		},
		onError: (_error, _variables, context) => {
			if (!context) {
				return;
			}

			for (const [queryKey, data] of context.previous) {
				queryClient.setQueryData(queryKey, data);
			}
		},
		onSuccess: async () => {
			await invalidateChampionshipQueries(queryClient);
		},
	});
}

export function useUploadChampionshipLogo(championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			file,
			previousPath,
		}: {
			file: File;
			previousPath: string | null;
		}) => uploadChampionshipLogo(championshipId, file, previousPath),
		onSuccess: async () => {
			await invalidateChampionshipQueries(queryClient);
		},
	});
}

export function useTransferChampionshipOwner() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (playerId: number) => transferChampionshipOwner(playerId),
		onSuccess: async () => {
			await invalidateChampionshipQueries(queryClient);
		},
	});
}

export function useUnlinkPlayer() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (playerId: number) => unlinkPlayer(playerId),
		onSuccess: async () => {
			await invalidateChampionshipQueries(queryClient);
		},
	});
}

export function useMergeChampionshipPlayers() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			keepPlayerId,
			absorbPlayerId,
		}: {
			keepPlayerId: number;
			absorbPlayerId: number;
		}) => mergeChampionshipPlayers(keepPlayerId, absorbPlayerId),
		onSuccess: async () => {
			await Promise.all([
				invalidateChampionshipQueries(queryClient),
				invalidateChampionshipEventQueries(queryClient),
			]);
		},
	});
}

export function useDeactivatePlayer() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (playerId: number) => deactivatePlayer(playerId),
		onSuccess: async () => {
			await invalidateChampionshipQueries(queryClient);
		},
	});
}

export function useReactivatePlayer() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (playerId: number) => reactivatePlayer(playerId),
		onSuccess: async () => {
			await invalidateChampionshipQueries(queryClient);
		},
	});
}

export function useRemovePlayer() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (playerId: number) => removePlayer(playerId),
		onSuccess: async () => {
			await invalidateChampionshipQueries(queryClient);
		},
	});
}

export function useDeleteChampionship() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (championshipId: number) => deleteChampionship(championshipId),
		onSuccess: async () => {
			await invalidateChampionshipQueries(queryClient);
		},
	});
}
