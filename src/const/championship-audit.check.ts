import {
	AUDIT_ACTION,
	auditActionLabel,
	formatAuditSnapshot,
	isAuditAction,
} from "./championship-audit.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(isAuditAction(AUDIT_ACTION.updatePlayerRating), "known action");
check(!isAuditAction("nope"), "unknown action");
check(
	auditActionLabel(AUDIT_ACTION.updatePlayerRating) === "Nota alterada",
	"rating label",
);
check(auditActionLabel("custom") === "custom", "unknown label passthrough");
check(
	formatAuditSnapshot({ rating: 4, role: "admin", nested: { a: 1 } }) ===
		"rating: 4 · role: admin",
	"flat snapshot",
);
check(formatAuditSnapshot(null) === null, "null snapshot");
check(formatAuditSnapshot([]) === null, "array snapshot");

console.log("championship-audit ok");
