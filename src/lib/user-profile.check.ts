import { enlargeAvatarUrl } from "./user-profile.ts";

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

console.log("user-profile ok");
