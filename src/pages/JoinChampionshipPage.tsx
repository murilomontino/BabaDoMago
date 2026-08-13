import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { ChampionshipLogo } from "@/components/championship-logo";
import { ChampionshipRoster } from "@/components/championship-roster";
import { ROUTES } from "@/const/routes";
import { useAuth } from "@/contexts/auth";
import {
	useChampionshipByInvite,
	useClaimPlayer,
	useJoinChampionship,
} from "@/hooks/championships/use-championships";
import { withClaimQuery } from "@/lib/safe-path";

export function JoinChampionshipPage() {
	const { inviteCode } = useParams({ from: "/join/$inviteCode" });
	const { claim } = useSearch({ from: "/join/$inviteCode" });
	const { user, isLoading: isAuthLoading } = useAuth();
	const navigate = useNavigate();
	const { data, isPending, isError, error } =
		useChampionshipByInvite(inviteCode);
	const joinChampionship = useJoinChampionship(inviteCode);
	const claimPlayer = useClaimPlayer();
	const claimedRef = useRef(false);

	const alreadyMember = Boolean(
		user && data?.players.some((player) => player.user_id === user.id),
	);

	useEffect(() => {
		if (!user || !claim || claimedRef.current) {
			return;
		}

		const playerId = Number(claim);
		if (!Number.isFinite(playerId)) {
			return;
		}

		claimedRef.current = true;
		claimPlayer.mutate(playerId, {
			onSettled: () => {
				void navigate({
					to: ROUTES.join,
					params: { inviteCode },
					search: {},
					replace: true,
				});
			},
		});
	}, [user, claim, claimPlayer, inviteCode, navigate]);

	function handleClaim(playerId: number) {
		if (user) {
			claimPlayer.mutate(playerId);
			return;
		}

		void navigate({
			to: ROUTES.login,
			search: {
				redirect: withClaimQuery(`/join/${inviteCode}`, String(playerId)),
			},
		});
	}

	if (isPending || isAuthLoading) {
		return (
			<main className="mx-auto max-w-3xl px-4 py-8">
				<p>Carregando campeonato...</p>
			</main>
		);
	}

	if (isError) {
		return (
			<main className="mx-auto max-w-3xl px-4 py-8">
				<p>Erro ao carregar campeonato: {error.message}</p>
			</main>
		);
	}

	return (
		<main className="mx-auto max-w-3xl px-4 py-8">
			<p className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-500">
				Campeonato
			</p>
			<div className="mb-6 flex items-center gap-3">
				<ChampionshipLogo
					path={data.logo_path}
					name={data.name}
					className="h-14 w-14 rounded-lg object-cover"
				/>
				<h1 className="text-2xl font-semibold">{data.name}</h1>
			</div>
			<ChampionshipRoster
				players={data.players}
				createdBy={data.created_by}
				currentUserId={user?.id ?? null}
				claimingPlayerId={claimPlayer.variables ?? null}
				onClaim={handleClaim}
			/>
			{!alreadyMember && user && (
				<button
					type="button"
					onClick={() => joinChampionship.mutate()}
					disabled={joinChampionship.isPending}
					className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
				>
					Inscrever-me
				</button>
			)}
			{!user && (
				<button
					type="button"
					onClick={() =>
						navigate({
							to: ROUTES.login,
							search: { redirect: `/join/${inviteCode}` },
						})
					}
					className="mt-6 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
				>
					Entrar para se inscrever
				</button>
			)}
			{joinChampionship.isError && (
				<p className="mt-4 text-sm text-red-600">
					{joinChampionship.error.message}
				</p>
			)}
			{claimPlayer.isError && (
				<p className="mt-4 text-sm text-red-600">{claimPlayer.error.message}</p>
			)}
		</main>
	);
}
