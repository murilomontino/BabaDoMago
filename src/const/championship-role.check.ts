import {
	CHAMPIONSHIP_ROLE,
	canDeactivatePlayer,
	canDeleteChampionship,
	canInvite,
	canReactivatePlayer,
	canRenameChampionship,
	canSetRoles,
	canTransferOwnership,
	canUnlinkPlayer,
	canUpdateRating,
	resolveChampionshipRole,
} from "./championship-role.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

const owner = CHAMPIONSHIP_ROLE.owner;
const captain = CHAMPIONSHIP_ROLE.captain;
const admin = CHAMPIONSHIP_ROLE.admin;
const member = CHAMPIONSHIP_ROLE.member;

check(canDeleteChampionship(owner), "owner deletes");
check(canSetRoles(owner), "owner sets roles");
check(canRenameChampionship(owner), "owner renames");
check(canUpdateRating(owner), "owner rates");
check(canInvite(owner), "owner invites");
check(canTransferOwnership(owner), "owner transfers");
check(canUnlinkPlayer(owner), "owner unlinks");
check(canDeactivatePlayer(owner), "owner deactivates");
check(canReactivatePlayer(owner), "owner reactivates");

check(!canDeleteChampionship(captain), "captain cannot delete");
check(!canSetRoles(captain), "captain cannot set roles");
check(canRenameChampionship(captain), "captain renames");
check(canUpdateRating(captain), "captain rates");
check(canInvite(captain), "captain invites");
check(!canTransferOwnership(captain), "captain cannot transfer");
check(canUnlinkPlayer(captain), "captain unlinks");
check(canDeactivatePlayer(captain), "captain deactivates");
check(!canReactivatePlayer(captain), "captain cannot reactivate");

check(!canDeleteChampionship(admin), "admin cannot delete");
check(!canSetRoles(admin), "admin cannot set roles");
check(!canRenameChampionship(admin), "admin cannot rename");
check(canUpdateRating(admin), "admin rates");
check(canInvite(admin), "admin invites");
check(!canTransferOwnership(admin), "admin cannot transfer");
check(canUnlinkPlayer(admin), "admin unlinks");
check(canDeactivatePlayer(admin), "admin deactivates");
check(!canReactivatePlayer(admin), "admin cannot reactivate");

check(!canDeleteChampionship(member), "member cannot delete");
check(!canSetRoles(member), "member cannot set roles");
check(!canRenameChampionship(member), "member cannot rename");
check(!canUpdateRating(member), "member cannot rate");
check(!canInvite(member), "member cannot invite");
check(!canTransferOwnership(member), "member cannot transfer");
check(!canUnlinkPlayer(member), "member cannot unlink");
check(!canDeactivatePlayer(member), "member cannot deactivate");
check(!canReactivatePlayer(member), "member cannot reactivate");

check(
	resolveChampionshipRole("owner-id", "owner-id", member) === owner,
	"created_by is owner even if stored member",
);
check(
	resolveChampionshipRole("owner-id", "other-id", captain) === captain,
	"stored captain",
);
check(
	resolveChampionshipRole("owner-id", null, captain) === member,
	"unlinked has no elevated role",
);

console.log("championship-role ok");
