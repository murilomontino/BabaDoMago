import { handlerWhenAllowed } from "./handler-when-allowed.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

const save = () => "ok";

check(handlerWhenAllowed(true, save) === save, "passes handler");
check(
	handlerWhenAllowed(false, save) === undefined,
	"hides without permission",
);
check(handlerWhenAllowed(null, save) === undefined, "hides when missing");
check(
	handlerWhenAllowed(save, save) === save,
	"truthy callback enables handler",
);

console.log("handler-when-allowed ok");
