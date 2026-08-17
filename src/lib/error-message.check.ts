import {
	caughtErrorMessage,
	mutationErrorMessage,
	pendingMutationId,
} from "./error-message.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(
	mutationErrorMessage({ isError: false, error: { message: "x" } }) === null,
	"idle mutation hides message",
);
check(
	mutationErrorMessage({ isError: true, error: { message: "falhou" } }) ===
		"falhou",
	"failed mutation shows message",
);
check(
	mutationErrorMessage({ isError: true, error: null }) === null,
	"error without payload",
);
check(
	mutationErrorMessage({ isError: true, error: { message: "x" } }, true) ===
		null,
	"hidden while another ui shows it",
);
check(caughtErrorMessage(new Error("boom"), "fallback") === "boom", "Error");
check(caughtErrorMessage("nope", "fallback") === "fallback", "unknown catch");
check(
	pendingMutationId({ isPending: false, variables: 7 }) === null,
	"idle has no busy id",
);
check(
	pendingMutationId({ isPending: true, variables: 7 }) === 7,
	"pending exposes variables",
);
check(
	pendingMutationId({ isPending: true }) === null,
	"pending without variables",
);

console.log("error-message ok");
