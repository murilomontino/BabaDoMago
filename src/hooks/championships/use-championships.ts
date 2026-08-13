import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	addManualPlayer,
	claimPlayer,
	createChampionship,
	deleteChampionship,
	getChampionshipById,
	getChampionshipByInvite,
	joinChampionship,
	listChampionships,
	renameChampionship,
	setPlayerRole,
	updatePlayerRating,
} from "@/services/championships";
import {
	CHAMPIONSHIP_BY_ID_QUERY_KEY,
	CHAMPIONSHIP_BY_INVITE_QUERY_KEY,
	CHAMPIONSHIPS_QUERY_KEY,
} from "./championships-query-keys";

export function useChampionships() {
	return useQuery({
		queryKey: CHAMPIONSHIPS_QUERY_KEY,
		queryFn: listChampionships,
	});
}

export function useChampionship(championshipId: number) {
	return useQuery({
		queryKey: [...CHAMPIONSHIP_BY_ID_QUERY_KEY, championshipId],
		queryFn: () => getChampionshipById(championshipId),
		enabled: Number.isFinite(championshipId),
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
			await queryClient.invalidateQueries({
				queryKey: CHAMPIONSHIPS_QUERY_KEY,
			});
		},
	});
}

export function useAddManualPlayer(championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (displayName: string) =>
			addManualPlayer(championshipId, displayName),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: CHAMPIONSHIP_BY_ID_QUERY_KEY,
			});
			await queryClient.invalidateQueries({
				queryKey: CHAMPIONSHIP_BY_INVITE_QUERY_KEY,
			});
		},
	});
}

export function useJoinChampionship(inviteCode: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => joinChampionship(inviteCode),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: CHAMPIONSHIP_BY_INVITE_QUERY_KEY,
			});
			await queryClient.invalidateQueries({
				queryKey: CHAMPIONSHIPS_QUERY_KEY,
			});
			await queryClient.invalidateQueries({
				queryKey: CHAMPIONSHIP_BY_ID_QUERY_KEY,
			});
		},
	});
}

export function useClaimPlayer() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (playerId: number) => claimPlayer(playerId),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: CHAMPIONSHIP_BY_INVITE_QUERY_KEY,
			});
			await queryClient.invalidateQueries({
				queryKey: CHAMPIONSHIPS_QUERY_KEY,
			});
			await queryClient.invalidateQueries({
				queryKey: CHAMPIONSHIP_BY_ID_QUERY_KEY,
			});
		},
	});
}

export function useUpdatePlayerRating() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ playerId, rating }: { playerId: number; rating: number }) =>
			updatePlayerRating(playerId, rating),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: CHAMPIONSHIP_BY_ID_QUERY_KEY,
			});
			await queryClient.invalidateQueries({
				queryKey: CHAMPIONSHIP_BY_INVITE_QUERY_KEY,
			});
		},
	});
}

export function useRenameChampionship(championshipId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (name: string) => renameChampionship(championshipId, name),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: CHAMPIONSHIP_BY_ID_QUERY_KEY,
			});
			await queryClient.invalidateQueries({
				queryKey: CHAMPIONSHIPS_QUERY_KEY,
			});
		},
	});
}

export function useSetPlayerRole() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ playerId, role }: { playerId: number; role: string }) =>
			setPlayerRole(playerId, role),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: CHAMPIONSHIP_BY_ID_QUERY_KEY,
			});
			await queryClient.invalidateQueries({
				queryKey: CHAMPIONSHIP_BY_INVITE_QUERY_KEY,
			});
		},
	});
}

export function useDeleteChampionship() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (championshipId: number) => deleteChampionship(championshipId),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: CHAMPIONSHIPS_QUERY_KEY,
			});
		},
	});
}
