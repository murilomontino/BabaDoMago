import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { ROUTES } from "@/const/routes";
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
				<p>Carregando sessão...</p>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-3xl px-4 py-8">
			<header className="mb-8 flex flex-wrap items-center justify-between gap-4">
				<nav className="flex gap-4">
					<Link
						to={ROUTES.home}
						className="font-medium text-slate-700 hover:text-slate-900"
					>
						Início
					</Link>
				</nav>
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
						<span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-700">
							{initial}
						</span>
					)}
					{user?.email && <span className="text-slate-600">{user.email}</span>}
					<button
						type="button"
						onClick={handleSignOut}
						className="rounded border border-slate-300 px-3 py-1 hover:bg-slate-50"
					>
						Sair
					</button>
				</div>
			</header>
			<Outlet />
		</div>
	);
}
