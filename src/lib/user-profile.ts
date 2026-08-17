import type { User } from "@supabase/supabase-js";

const AVATAR_PREVIEW_SIZE = 800 as const;

export function enlargeAvatarUrl(url: string): string {
	const googleSized = url.replace(/=s\d+\b/, `=s${AVATAR_PREVIEW_SIZE}`);
	if (googleSized !== url) {
		return googleSized;
	}

	return url.replace(/([?&])sz=\d+/, `$1sz=${AVATAR_PREVIEW_SIZE}`);
}

type AvatarMetadata = {
	avatar_url?: unknown;
	picture?: unknown;
};

function avatarUrlFromRecord(
	data: AvatarMetadata | null | undefined,
): string | null {
	if (!data) {
		return null;
	}

	const avatarUrl = data.avatar_url;
	if (typeof avatarUrl === "string" && avatarUrl.length > 0) {
		return avatarUrl;
	}

	const picture = data.picture;
	if (typeof picture === "string" && picture.length > 0) {
		return picture;
	}

	return null;
}

export function getUserAvatarUrl(user: User | null): string | null {
	if (!user) {
		return null;
	}

	const googleIdentity = user.identities?.find(
		(identity) => identity.provider === "google",
	);

	return (
		avatarUrlFromRecord(googleIdentity?.identity_data) ??
		avatarUrlFromRecord(user.user_metadata)
	);
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
