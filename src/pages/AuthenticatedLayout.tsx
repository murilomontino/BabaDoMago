import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { House, LogOut, Trophy } from "lucide-react";
import { Button } from "@/components/button";
import { ROUTES } from "@/const/routes";
import { BUTTON_VARIANT } from "@/const/ui";
import { useAuth } from "@/contexts/auth";
import { getUserAvatarUrl, getUserInitial } from "@/lib/user-profile";

export function AuthenticatedLayout() {
	const { user, signOut, isLoading } = useAuth();
	const navigate = useNavigate();
	const avatarUrl = getUserAvatarUrl(user);
	const initial = getUserInitial(user);

	async function handleSignOut() {
		await signOut();
		await navigate({ to: ROUTES.login });
	}

	if (isLoading) {
		return (
			<div className="mx-auto max-w-3xl px-4 py-8">
				<p className="text-stone-600">Carregando sessão...</p>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-3xl px-4 py-8">
			<header className="mb-8">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<Link
						to={ROUTES.home}
						className="flex items-center gap-2 font-semibold tracking-tight text-pitch"
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
							<span className="flex h-8 w-8 items-center justify-center rounded-full bg-pitch-soft text-xs font-medium text-pitch">
								{initial}
							</span>
						)}
						{user?.email && (
							<span className="hidden text-stone-600 sm:inline">
								{user.email}
							</span>
						)}
						<Button variant={BUTTON_VARIANT.ghost} onClick={handleSignOut}>
							<LogOut className="size-4" />
							Sair
						</Button>
					</div>
				</div>
				<nav className="mt-4">
					<Link
						to={ROUTES.home}
						className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-700 hover:text-pitch"
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
