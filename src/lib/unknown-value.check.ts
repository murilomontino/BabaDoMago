import {
	optionalNumber,
	optionalRecord,
	optionalString,
} from "./unknown-value.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(optionalString("ok") === "ok", "string");
check(optionalString(1) === null, "not string");
check(optionalString(null) === null, "null string");
check(optionalNumber(3) === 3, "number");
check(optionalNumber("3") === null, "not number");
check(optionalRecord({ a: 1 })?.a === 1, "record");
check(optionalRecord(null) === null, "null record");
check(optionalRecord("x") === null, "string is not record");

console.log("unknown-value ok");
