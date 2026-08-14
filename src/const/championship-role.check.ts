import {
	CHAMPIONSHIP_ROLE,
	canDeactivatePlayer,
	canDeleteChampionship,
	canEditPlayerNickname,
	canInvite,
	canMergePlayers,
	canOverrideEndedEvent,
	canReactivatePlayer,
	canRenameChampionship,
	canSetRoles,
	canTransferOwnership,
	canUnlinkPlayer,
	canUpdateEventConfig,
	canUpdateNickname,
	canUpdateRating,
	canUpdateVisibility,
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
check(canUpdateNickname(owner), "owner nicknames");
check(canInvite(owner), "owner invites");
check(canTransferOwnership(owner), "owner transfers");
check(canUnlinkPlayer(owner), "owner unlinks");
check(canMergePlayers(owner), "owner merges");
check(canDeactivatePlayer(owner), "owner deactivates");
check(canReactivatePlayer(owner), "owner reactivates");
check(canUpdateEventConfig(owner), "owner updates event config");
check(canUpdateVisibility(owner), "owner updates visibility");
check(canOverrideEndedEvent(owner), "owner overrides ended event");

check(!canDeleteChampionship(captain), "captain cannot delete");
check(!canSetRoles(captain), "captain cannot set roles");
check(canRenameChampionship(captain), "captain renames");
check(canUpdateRating(captain), "captain rates");
check(canUpdateNickname(captain), "captain nicknames");
check(canInvite(captain), "captain invites");
check(!canTransferOwnership(captain), "captain cannot transfer");
check(canUnlinkPlayer(captain), "captain unlinks");
check(canMergePlayers(captain), "captain merges");
check(canDeactivatePlayer(captain), "captain deactivates");
check(!canReactivatePlayer(captain), "captain cannot reactivate");
check(canUpdateEventConfig(captain), "captain updates event config");
check(canUpdateVisibility(captain), "captain updates visibility");
check(!canOverrideEndedEvent(captain), "captain cannot override ended event");

check(!canDeleteChampionship(admin), "admin cannot delete");
check(!canSetRoles(admin), "admin cannot set roles");
check(!canRenameChampionship(admin), "admin cannot rename");
check(canUpdateRating(admin), "admin rates");
check(canUpdateNickname(admin), "admin nicknames");
check(canInvite(admin), "admin invites");
check(!canTransferOwnership(admin), "admin cannot transfer");
check(canUnlinkPlayer(admin), "admin unlinks");
check(canMergePlayers(admin), "admin merges");
check(canDeactivatePlayer(admin), "admin deactivates");
check(!canReactivatePlayer(admin), "admin cannot reactivate");
check(!canUpdateEventConfig(admin), "admin cannot update event config");
check(!canUpdateVisibility(admin), "admin cannot update visibility");
check(!canOverrideEndedEvent(admin), "admin cannot override ended event");

check(!canDeleteChampionship(member), "member cannot delete");
check(!canSetRoles(member), "member cannot set roles");
check(!canRenameChampionship(member), "member cannot rename");
check(!canUpdateRating(member), "member cannot rate");
check(!canUpdateNickname(member), "member cannot nickname others");
check(!canInvite(member), "member cannot invite");
check(!canTransferOwnership(member), "member cannot transfer");
check(!canUnlinkPlayer(member), "member cannot unlink");
check(!canMergePlayers(member), "member cannot merge");
check(!canDeactivatePlayer(member), "member cannot deactivate");
check(!canReactivatePlayer(member), "member cannot reactivate");
check(!canUpdateEventConfig(member), "member cannot update event config");
check(!canUpdateVisibility(member), "member cannot update visibility");
check(!canOverrideEndedEvent(member), "member cannot override ended event");

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

check(
	canEditPlayerNickname(owner, "other-id", "owner-id"),
	"owner edits other nickname",
);
check(
	canEditPlayerNickname(member, "self-id", "self-id"),
	"member edits own nickname",
);
check(
	!canEditPlayerNickname(member, "other-id", "self-id"),
	"member cannot edit other nickname",
);
check(
	!canEditPlayerNickname(member, null, "self-id"),
	"member cannot edit guest nickname",
);
check(
	canEditPlayerNickname(admin, null, "admin-id"),
	"admin edits guest nickname",
);

console.log("championship-role ok");
