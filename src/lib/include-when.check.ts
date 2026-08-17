import { includeDefined, includeWhen } from "./include-when.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(includeWhen(true, 7).join(",") === "7", "keeps value");
check(includeWhen(false, 7).length === 0, "drops value");
check(includeDefined(3).join(",") === "3", "keeps defined");
check(includeDefined(null).length === 0, "drops null");
check(includeDefined(undefined).length === 0, "drops undefined");

console.log("include-when ok");
