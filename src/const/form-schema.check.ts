import {
	addPlayerFormSchema,
	deleteChampionshipSchema,
	FORM_MESSAGE,
	nameFormSchema,
	playerNicknameSchema,
	playerRatingSchema,
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
	}),
	"add player ok",
);
check(
	!addPlayerFormSchema.isValidSync({ name: "", rating: 0 }),
	"add player needs name",
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
	transferOwnerSchema.isValidSync({ playerId: "12" }),
	"transfer player id ok",
);
check(
	!transferOwnerSchema.isValidSync({ playerId: "" }),
	"transfer empty fails",
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
