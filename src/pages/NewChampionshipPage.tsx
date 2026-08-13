import { useNavigate } from "@tanstack/react-router";
import { Field, Form, Formik } from "formik";
import { Trophy } from "lucide-react";
import { Button } from "@/components/button";
import { FormError } from "@/components/form-error";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import {
	championshipQuotaHint,
	isChampionshipQuotaReached,
	ownedChampionshipCount,
} from "@/const/championship-quota";
import { nameFormSchema } from "@/const/form-schema";
import { ROUTES } from "@/const/routes";
import { ERROR_CLASS, FIELD_CLASS } from "@/const/ui";
import { useAuth } from "@/contexts/auth";
import {
	useChampionships,
	useCreateChampionship,
} from "@/hooks/championships/use-championships";
import { getUserAvatarUrl, getUserDisplayName } from "@/lib/user-profile";

export function NewChampionshipPage() {
	const { user } = useAuth();
	const navigate = useNavigate();
	const createChampionship = useCreateChampionship();
	const { data: championships, isPending } = useChampionships();
	const atLimit = isChampionshipQuotaReached(
		ownedChampionshipCount(championships ?? [], user?.id ?? ""),
	);

	if (isPending) {
		return <p className="text-fg-muted">Carregando campeonatos...</p>;
	}

	return (
		<main>
			<PageHeader title="Novo campeonato" description="Dê um nome pro baba." />
			{atLimit && (
				<p className="text-sm text-fg-muted">{championshipQuotaHint()}</p>
			)}
			{!atLimit && (
				<SectionCard
					title="Dados"
					icon={<Trophy className="size-4 text-pitch-fg" />}
				>
					<Formik
						initialValues={{ name: "" }}
						validationSchema={nameFormSchema}
						onSubmit={async (values) => {
							if (!user || atLimit) {
								return;
							}

							const championship = await createChampionship.mutateAsync({
								name: values.name,
								userId: user.id,
								displayName: getUserDisplayName(user),
								avatarUrl: getUserAvatarUrl(user),
							});

							await navigate({
								to: ROUTES.championship,
								params: { championshipId: String(championship.id) },
							});
						}}
					>
						<Form className="space-y-4">
							<label
								htmlFor="new-championship-name"
								className="block text-sm font-medium text-fg-muted"
							>
								Nome
								<Field
									id="new-championship-name"
									name="name"
									className={`mt-1 ${FIELD_CLASS}`}
								/>
							</label>
							<FormError name="name" />
							<Button type="submit" disabled={createChampionship.isPending}>
								Criar
							</Button>
							{createChampionship.isError && (
								<p className={ERROR_CLASS}>
									{createChampionship.error.message}
								</p>
							)}
						</Form>
					</Formik>
				</SectionCard>
			)}
		</main>
	);
}
