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

export function getUserDisplayName(user: User | null): string {
	if (!user) {
		return "Jogador";
	}

	const fullName = user.user_metadata.full_name;
	if (typeof fullName === "string" && fullName.trim().length > 0) {
		return fullName.trim();
	}

	const name = user.user_metadata.name;
	if (typeof name === "string" && name.trim().length > 0) {
		return name.trim();
	}

	if (user.email) {
		return user.email;
	}

	return "Jogador";
}

export function getUserInitial(user: User | null): string {
	return getUserDisplayName(user).charAt(0).toUpperCase();
}
