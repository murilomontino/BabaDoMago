import type { User } from "@supabase/supabase-js";

export function getUserAvatarUrl(user: User | null): string | null {
	if (!user) {
		return null;
	}

	const avatarUrl = user.user_metadata.avatar_url;
	if (typeof avatarUrl === "string" && avatarUrl.length > 0) {
		return avatarUrl;
	}

	const picture = user.user_metadata.picture;
	if (typeof picture === "string" && picture.length > 0) {
		return picture;
	}

	return null;
}

export function getUserInitial(user: User | null): string {
	const source = user?.user_metadata.full_name ?? user?.email ?? "?";
	return source.trim().charAt(0).toUpperCase();
}
