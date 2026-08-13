import { number, object, string } from "yup";
import { CHAMPIONSHIP_EVENT } from "./championship-event.ts";
import { PLAYER_NICKNAME } from "./player-name.ts";
import { PLAYER_RATING } from "./player-rating.ts";

export const FORM_MESSAGE = {
	nameRequired: "Informe o nome",
	nameMismatch: "Nome não confere",
	playerRequired: "Selecione um jogador",
	ratingInvalid: "Nota inválida",
	nicknameInvalid: "Apelido inválido",
	eventTimeInvalid: "Hora inválida",
	playersPerTeamInvalid: "Limite inválido",
	eventDateRequired: "Informe a data",
	teamRequired: "Selecione o time",
	teamsDistinct: "Escolha dois times",
} as const;

const ratingField = number()
	.min(PLAYER_RATING.min, FORM_MESSAGE.ratingInvalid)
	.max(PLAYER_RATING.max, FORM_MESSAGE.ratingInvalid)
	.required(FORM_MESSAGE.ratingInvalid);

export const nameFormSchema = object({
	name: string().trim().required(FORM_MESSAGE.nameRequired),
});

export const addPlayerFormSchema = object({
	name: string().trim().required(FORM_MESSAGE.nameRequired),
	rating: ratingField,
});

export const playerRatingSchema = object({
	rating: ratingField,
});

export const playerNicknameSchema = object({
	nickname: string()
		.trim()
		.max(PLAYER_NICKNAME.maxLength, FORM_MESSAGE.nicknameInvalid),
});

export const transferOwnerSchema = object({
	playerId: string().trim().required(FORM_MESSAGE.playerRequired),
});

export const eventConfigFormSchema = object({
	eventTime: string()
		.trim()
		.matches(/^\d{2}:\d{2}(:\d{2})?$/, FORM_MESSAGE.eventTimeInvalid)
		.required(FORM_MESSAGE.eventTimeInvalid),
	playersPerTeam: number()
		.integer(FORM_MESSAGE.playersPerTeamInvalid)
		.min(
			CHAMPIONSHIP_EVENT.playersPerTeamMin,
			FORM_MESSAGE.playersPerTeamInvalid,
		)
		.max(
			CHAMPIONSHIP_EVENT.playersPerTeamMax,
			FORM_MESSAGE.playersPerTeamInvalid,
		)
		.required(FORM_MESSAGE.playersPerTeamInvalid),
});

export const startEventFormSchema = object({
	eventDate: string().trim().required(FORM_MESSAGE.eventDateRequired),
});

export const addMatchFormSchema = object({
	teamAId: string().trim().required(FORM_MESSAGE.teamRequired),
	teamBId: string().trim().required(FORM_MESSAGE.teamRequired),
}).test("distinct", FORM_MESSAGE.teamsDistinct, (value) => {
	if (!value.teamAId || !value.teamBId) {
		return true;
	}

	return value.teamAId !== value.teamBId;
});

export function deleteChampionshipSchema(expectedName: string) {
	return object({
		typedName: string()
			.required(FORM_MESSAGE.nameRequired)
			.test(
				"match",
				FORM_MESSAGE.nameMismatch,
				(value) => value?.trim() === expectedName,
			),
	});
}
