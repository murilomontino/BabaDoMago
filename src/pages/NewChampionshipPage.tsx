import { useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { ROUTES } from "@/const/routes";
import { useAuth } from "@/contexts/auth";
import { useCreateChampionship } from "@/hooks/championships/use-championships";
import { getUserAvatarUrl, getUserDisplayName } from "@/lib/user-profile";

export function NewChampionshipPage() {
	const { user } = useAuth();
	const navigate = useNavigate();
	const createChampionship = useCreateChampionship();
	const [name, setName] = useState("");

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!user) {
			return;
		}

		const trimmedName = name.trim();
		if (!trimmedName) {
			return;
		}

		const championship = await createChampionship.mutateAsync({
			name: trimmedName,
			userId: user.id,
			displayName: getUserDisplayName(user),
			avatarUrl: getUserAvatarUrl(user),
		});

		await navigate({
			to: ROUTES.championship,
			params: { championshipId: String(championship.id) },
		});
	}

	return (
		<main>
			<h1 className="mb-6 text-2xl font-semibold">Novo campeonato</h1>
			<form onSubmit={handleSubmit} className="max-w-md space-y-4">
				<label className="block text-sm font-medium text-slate-700">
					Nome
					<input
						value={name}
						onChange={(event) => setName(event.target.value)}
						required
						className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
					/>
				</label>
				<button
					type="submit"
					disabled={createChampionship.isPending}
					className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
				>
					Criar
				</button>
				{createChampionship.isError && (
					<p className="text-sm text-red-600">
						{createChampionship.error.message}
					</p>
				)}
			</form>
		</main>
	);
}
