import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getUserAvatarUrl, getUserDisplayName } from "@/lib/user-profile";

export async function ensureCurrentUser(user: User): Promise<void> {
	const { error } = await supabase.from("users").upsert({
		id: user.id,
		email: user.email,
		display_name: getUserDisplayName(user),
		avatar_url: getUserAvatarUrl(user),
		updated_at: new Date().toISOString(),
	});

	if (error) {
		throw error;
	}
}
