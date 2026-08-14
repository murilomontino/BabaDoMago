import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { Trophy, UserPlus, Users } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/button";
import { ChampionshipLogo } from "@/components/championship-logo";
import { ChampionshipRoster } from "@/components/championship-roster";
import { SectionCard } from "@/components/section-card";
import { ThemeToggle } from "@/components/theme-toggle";
import {
	confirmClaimPlayerMessage,
	playerVisibleName,
} from "@/const/player-name";
import { ROUTES } from "@/const/routes";
import {
	BUTTON_VARIANT,
	CARD_CLASS,
	ERROR_CLASS,
	PAGE_SHELL_CLASS,
} from "@/const/ui";
import { useAuth } from "@/contexts/auth";
import {
	useChampionshipByInvite,
	useClaimPlayer,
	useJoinChampionship,
} from "@/hooks/championships/use-championships";
import { withClaimQuery } from "@/lib/safe-path";
import type { ChampionshipPlayer } from "@/types/championship";

const JOIN_PAGE = {
	hint: "Se seu nome já está no elenco, clique em Conectar.",
	notInList: "Não estou na lista",
	loginToConnect: "Entrar para conectar",
} as const;

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
		user &&
			data?.players.some(
				(player: ChampionshipPlayer) => player.user_id === user.id,
			),
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
			onSuccess: (claimed) => {
				void navigate({
					to: ROUTES.championship,
					params: { championshipId: String(claimed.championship_id) },
					replace: true,
				});
			},
			onError: () => {
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
		const player = data?.players.find((item) => item.id === playerId);
		if (!player) {
			return;
		}

		if (!window.confirm(confirmClaimPlayerMessage(playerVisibleName(player)))) {
			return;
		}

		if (user) {
			claimPlayer.mutate(playerId, {
				onSuccess: (claimed) => {
					void navigate({
						to: ROUTES.championship,
						params: { championshipId: String(claimed.championship_id) },
						replace: true,
					});
				},
			});
			return;
		}

		void navigate({
			to: ROUTES.login,
			search: {
				redirect: withClaimQuery(`/join/${inviteCode}`, String(playerId)),
			},
		});
	}

	function handleJoin() {
		joinChampionship.mutate(undefined, {
			onSuccess: (joined) => {
				void navigate({
					to: ROUTES.championship,
					params: { championshipId: String(joined.championship_id) },
					replace: true,
				});
			},
		});
	}

	if (isPending || isAuthLoading) {
		return (
			<main className={PAGE_SHELL_CLASS}>
				<p className="text-fg-muted">Carregando campeonato...</p>
			</main>
		);
	}

	if (isError) {
		return (
			<main className={PAGE_SHELL_CLASS}>
				<p className={ERROR_CLASS}>
					Erro ao carregar campeonato: {error.message}
				</p>
			</main>
		);
	}

	return (
		<main className={`${PAGE_SHELL_CLASS} space-y-6`}>
			<div className="flex justify-end">
				<ThemeToggle />
			</div>
			<section className={CARD_CLASS}>
				<p className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-pitch-fg">
					<Trophy className="size-4" />
					Campeonato
				</p>
				<div className="flex items-center gap-3">
					<ChampionshipLogo
						path={data.logo_path}
						name={data.name}
						className="h-16 w-16"
					/>
					<h1 className="text-2xl font-semibold tracking-tight text-fg">
						{data.name}
					</h1>
				</div>
			</section>
			<SectionCard
				title="Elenco"
				icon={<Users className="size-4 text-pitch-fg" />}
			>
				{!alreadyMember && (
					<p className="mb-3 text-sm text-fg-muted">{JOIN_PAGE.hint}</p>
				)}
				<ChampionshipRoster
					players={data.players}
					createdBy={data.created_by}
					currentUserId={user?.id ?? null}
					claimingPlayerId={claimPlayer.variables ?? null}
					onClaim={handleClaim}
				/>
			</SectionCard>
			{!alreadyMember && user && (
				<Button
					variant={BUTTON_VARIANT.secondary}
					onClick={handleJoin}
					disabled={joinChampionship.isPending}
				>
					<UserPlus className="size-4" />
					{JOIN_PAGE.notInList}
				</Button>
			)}
			{!user && (
				<Button
					variant={BUTTON_VARIANT.secondary}
					onClick={() =>
						navigate({
							to: ROUTES.login,
							search: { redirect: `/join/${inviteCode}` },
						})
					}
				>
					{JOIN_PAGE.loginToConnect}
				</Button>
			)}
			{joinChampionship.isError && (
				<p className={ERROR_CLASS}>{joinChampionship.error.message}</p>
			)}
			{claimPlayer.isError && (
				<p className={ERROR_CLASS}>{claimPlayer.error.message}</p>
			)}
		</main>
	);
}
