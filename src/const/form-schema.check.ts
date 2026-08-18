import { CHAMPIONSHIP_EVENT } from "./championship-event.ts";
import {
	addPlayerFormSchema,
	blankToNull,
	deleteChampionshipSchema,
	eventConfigFormSchema,
	FORM_MESSAGE,
	mergePlayersSchema,
	nameFormSchema,
	playerNicknameSchema,
	playerRatingSchema,
	startEventFormSchema,
	transferOwnerSchema,
} from "./form-schema.ts";
import { PLAYER_NICKNAME } from "./player-name.ts";
import { PLAYER_RATING } from "./player-rating.ts";

function check(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

check(FORM_MESSAGE.nameRequired === "Informe o nome", "name required message");
check(blankToNull("  baba  ") === "baba", "trims location");
check(blankToNull("   ") === null, "blank location is null");
check(blankToNull(1) === null, "non-string location is null");

check(nameFormSchema.isValidSync({ name: "Baba" }), "name ok");
check(!nameFormSchema.isValidSync({ name: "   " }), "name blank fails");
check(
	nameFormSchema.validateSync({ name: "  Baba  " }).name === "Baba",
	"name trims",
);

check(
	addPlayerFormSchema.isValidSync({
		name: "João",
		rating: PLAYER_RATING.default,
		isGoalkeeper: false,
	}),
	"add player ok",
);
check(
	!addPlayerFormSchema.isValidSync({ name: "", rating: 0 }),
	"add player needs name",
);
check(
	addPlayerFormSchema.isValidSync({
		name: "1. Vitinho ✅\n2. Murilo ✅",
		rating: PLAYER_RATING.default,
		isGoalkeeper: true,
	}),
	"add player list ok",
);
check(
	!addPlayerFormSchema.isValidSync({
		name: "1. ✅",
		rating: PLAYER_RATING.default,
	}),
	"add player emoji only fails",
);
check(
	!addPlayerFormSchema.isValidSync({
		name: "João",
		rating: PLAYER_RATING.max + 1,
	}),
	"add player rating over max",
);

check(playerRatingSchema.isValidSync({ rating: 0 }), "rating 0 ok");
check(playerRatingSchema.isValidSync({ rating: 50.5 }), "rating decimal ok");
check(
	!playerRatingSchema.isValidSync({ rating: PLAYER_RATING.min - 1 }),
	"rating below min",
);
check(
	!playerRatingSchema.isValidSync({ rating: PLAYER_RATING.max + 1 }),
	"rating above max",
);

check(playerNicknameSchema.isValidSync({ nickname: "" }), "empty nickname ok");
check(playerNicknameSchema.isValidSync({ nickname: "Vitinho" }), "nickname ok");
check(
	!playerNicknameSchema.isValidSync({
		nickname: "x".repeat(PLAYER_NICKNAME.maxLength + 1),
	}),
	"nickname too long",
);
check(
	playerNicknameSchema.isValidSync({
		nickname: "Vitinho",
		nickname_tags: ["Vita", "Vitin"],
		tagDraft: "",
	}),
	"nickname tags ok",
);
check(
	!playerNicknameSchema.isValidSync({
		nickname: "Vitinho",
		nickname_tags: Array.from({ length: PLAYER_NICKNAME.maxTags + 1 }, (_, i) =>
			String(i),
		),
		tagDraft: "",
	}),
	"nickname tags over max",
);
check(
	!playerNicknameSchema.isValidSync({
		nickname: "Vitinho",
		nickname_tags: ["x".repeat(PLAYER_NICKNAME.maxLength + 1)],
		tagDraft: "",
	}),
	"nickname tag too long",
);

check(
	transferOwnerSchema.isValidSync({ playerId: "12" }),
	"transfer player id ok",
);
check(
	!transferOwnerSchema.isValidSync({ playerId: "" }),
	"transfer empty fails",
);

check(
	mergePlayersSchema.isValidSync({
		keepPlayerId: "1",
		absorbPlayerId: "2",
	}),
	"merge players ok",
);
check(
	!mergePlayersSchema.isValidSync({
		keepPlayerId: "",
		absorbPlayerId: "2",
	}),
	"merge keep required",
);

check(
	startEventFormSchema.isValidSync({
		eventDate: "2026-08-14",
		eventTime: "19:00",
	}),
	"start event ok",
);
check(
	!startEventFormSchema.isValidSync({
		eventDate: "2026-08-14",
		eventTime: "invalid",
	}),
	"start event time invalid",
);

check(
	eventConfigFormSchema.isValidSync({
		eventTime: "19:00",
		playersPerTeam: CHAMPIONSHIP_EVENT.playersPerTeamDefault,
		skipGuestGoalkeeperMatches: true,
	}),
	"event config ok",
);
check(
	!eventConfigFormSchema.isValidSync({
		eventTime: "19:00",
		playersPerTeam: CHAMPIONSHIP_EVENT.playersPerTeamDefault,
	}),
	"event config needs guest keeper flag",
);

const deleteSchema = deleteChampionshipSchema("Baba do Mago");
check(
	deleteSchema.isValidSync({ typedName: "Baba do Mago" }),
	"delete name matches",
);
check(
	deleteSchema.isValidSync({ typedName: "  Baba do Mago  " }),
	"delete name trims",
);
check(
	!deleteSchema.isValidSync({ typedName: "outro" }),
	"delete mismatch fails",
);

console.log("form-schema ok");
