import {
	isSafeInternalPath,
	safeInternalPathOrHome,
	withClaimQuery,
} from "./safe-path.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(isSafeInternalPath("/home") === true, "internal");
check(isSafeInternalPath("//evil") === false, "protocol-relative");
check(isSafeInternalPath("https://x") === false, "absolute");
check(safeInternalPathOrHome("/ok") === "/ok", "keeps safe path");
check(safeInternalPathOrHome("//x") === "/", "falls back home");
check(safeInternalPathOrHome(undefined) === "/", "missing falls back home");
check(withClaimQuery("/join", "abc") === "/join?claim=abc", "first query");
check(
	withClaimQuery("/join?x=1", "abc") === "/join?x=1&claim=abc",
	"extra query",
);

console.log("safe-path ok");
