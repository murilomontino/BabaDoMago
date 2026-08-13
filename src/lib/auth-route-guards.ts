import { redirect } from "@tanstack/react-router";
import { ROUTES } from "@/const/routes";
import { supabase } from "@/lib/supabase";

export async function requireUser(): Promise<void> {
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (user) {
		return;
	}

	throw redirect({ to: ROUTES.login });
}

export async function requireGuest(): Promise<void> {
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return;
	}

	throw redirect({ to: ROUTES.home });
}
