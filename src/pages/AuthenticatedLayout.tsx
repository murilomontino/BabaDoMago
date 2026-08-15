import { Link, Outlet, useMatch, useNavigate } from "@tanstack/react-router";
import { House, LogOut, Trophy } from "lucide-react";
import { Skeleton, SkeletonRegion } from "@/components/atoms/skeleton";
import { Button } from "@/components/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ROUTES } from "@/const/routes";
import { SKELETON_LABEL } from "@/const/skeleton";
import { BUTTON_VARIANT, PAGE_SHELL_CLASS } from "@/const/ui";
import { useAuth } from "@/contexts/auth";
import { getUserAvatarUrl, getUserInitial } from "@/lib/user-profile";

export function AuthenticatedLayout() {
	const { user, signOut, isLoading } = useAuth();
	const navigate = useNavigate();
	const avatarUrl = getUserAvatarUrl(user);
	const initial = getUserInitial(user);
	const playRoute = useMatch({
		from: "/_authenticated/championships/$championshipId/events/$eventId/play",
		shouldThrow: false,
	});

	async function handleSignOut() {
		await signOut();
		await navigate({ to: ROUTES.login });
	}

	if (playRoute) {
		return <Outlet />;
	}

	if (isLoading) {
		return (
			<div className={PAGE_SHELL_CLASS}>
				<AuthenticatedLayoutSkeleton />
			</div>
		);
	}

	return (
		<div className={PAGE_SHELL_CLASS}>
			<header className="mb-8">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<Link
						to={ROUTES.home}
						className="flex items-center gap-2 font-semibold tracking-tight text-pitch-fg"
					>
						<Trophy className="size-5" />
						Baba do Mago
					</Link>
					<div className="flex items-center gap-3 text-sm">
						{avatarUrl && (
							<img
								src={avatarUrl}
								alt=""
								referrerPolicy="no-referrer"
								className="h-8 w-8 rounded-full object-cover"
							/>
						)}
						{!avatarUrl && (
							<span className="flex h-8 w-8 items-center justify-center rounded-full bg-pitch-soft text-xs font-medium text-pitch-fg">
								{initial}
							</span>
						)}
						{user?.email && (
							<span className="hidden text-fg-muted sm:inline">
								{user.email}
							</span>
						)}
						<ThemeToggle />
						<Button variant={BUTTON_VARIANT.ghost} onClick={handleSignOut}>
							<LogOut className="size-4" />
							Sair
						</Button>
					</div>
				</div>
				<nav className="mt-4">
					<Link
						to={ROUTES.home}
						className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-pitch-fg"
					>
						<House className="size-4" />
						Início
					</Link>
				</nav>
			</header>
			<Outlet />
		</div>
	);
}

function AuthenticatedLayoutSkeleton() {
	return (
		<SkeletonRegion label={SKELETON_LABEL.session}>
			<header className="mb-8">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<Link
						to={ROUTES.home}
						className="flex items-center gap-2 font-semibold tracking-tight text-pitch-fg"
					>
						<Trophy className="size-5" />
						Baba do Mago
					</Link>
					<div className="flex items-center gap-3 text-sm">
						<Skeleton className="h-8 w-8 rounded-full" />
						<Skeleton className="hidden h-4 w-40 sm:block" />
						<ThemeToggle />
						<Button variant={BUTTON_VARIANT.ghost} disabled>
							<LogOut className="size-4" />
							Sair
						</Button>
					</div>
				</div>
				<nav className="mt-4">
					<Link
						to={ROUTES.home}
						className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-pitch-fg"
					>
						<House className="size-4" />
						Início
					</Link>
				</nav>
			</header>
		</SkeletonRegion>
	);
}
