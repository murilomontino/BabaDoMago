import { number, object, string } from "yup";
import { PLAYER_RATING } from "./player-rating.ts";

export const FORM_MESSAGE = {
	nameRequired: "Informe o nome",
	nameMismatch: "Nome não confere",
	playerRequired: "Selecione um jogador",
	ratingInvalid: "Nota inválida",
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

export const transferOwnerSchema = object({
	playerId: string().trim().required(FORM_MESSAGE.playerRequired),
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
