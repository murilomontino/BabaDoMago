import type { User } from "@supabase/supabase-js";
import { enlargeAvatarUrl, getUserAvatarUrl } from "./user-profile.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(
	enlargeAvatarUrl("https://lh3.googleusercontent.com/a/abc=s96-c") ===
		"https://lh3.googleusercontent.com/a/abc=s800-c",
	"google s96-c",
);
check(
	enlargeAvatarUrl("https://lh3.googleusercontent.com/a/abc=s64") ===
		"https://lh3.googleusercontent.com/a/abc=s800",
	"google s64",
);
check(
	enlargeAvatarUrl("https://example.com/photo?sz=96") ===
		"https://example.com/photo?sz=800",
	"sz query",
);
check(
	enlargeAvatarUrl("https://example.com/photo?foo=1&sz=48") ===
		"https://example.com/photo?foo=1&sz=800",
	"sz amid query",
);
check(
	enlargeAvatarUrl("https://example.com/photo.jpg") ===
		"https://example.com/photo.jpg",
	"plain url",
);

function user(partial: {
	metadata?: User["user_metadata"];
	identities?: User["identities"];
}): User {
	return {
		id: "user-1",
		aud: "authenticated",
		app_metadata: {},
		user_metadata: partial.metadata ?? {},
		created_at: "2026-01-01T00:00:00Z",
		identities: partial.identities,
	};
}

check(getUserAvatarUrl(null) === null, "null user");
check(
	getUserAvatarUrl(
		user({
			metadata: { avatar_url: "https://old.example/meta.png" },
			identities: [
				{
					id: "google-1",
					user_id: "user-1",
					identity_id: "google-1",
					provider: "google",
					identity_data: {
						picture: "https://lh3.googleusercontent.com/a/new=s96-c",
					},
				},
			],
		}),
	) === "https://lh3.googleusercontent.com/a/new=s96-c",
	"google identity wins",
);
check(
	getUserAvatarUrl(
		user({
			metadata: { avatar_url: "https://old.example/meta.png" },
			identities: [
				{
					id: "email-1",
					user_id: "user-1",
					identity_id: "email-1",
					provider: "email",
					identity_data: { picture: "https://other.example/skip.png" },
				},
			],
		}),
	) === "https://old.example/meta.png",
	"metadata without google identity",
);
check(
	getUserAvatarUrl(
		user({ metadata: { picture: "https://old.example/pic.png" } }),
	) === "https://old.example/pic.png",
	"metadata picture fallback",
);

console.log("user-profile ok");
