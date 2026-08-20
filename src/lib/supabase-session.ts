import { supabase } from "@/lib/supabase";

export async function ensureSupabaseSession(fallback: string): Promise<void> {
	const { data, error } = await supabase.auth.getSession();
	if (error) {
		throw error;
	}

	if (data.session) {
		return;
	}

	const refreshed = await supabase.auth.refreshSession();
	if (refreshed.error) {
		throw refreshed.error;
	}

	if (refreshed.data.session) {
		return;
	}

	throw new Error(fallback);
}
