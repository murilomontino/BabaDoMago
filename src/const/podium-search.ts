import { parseAsInteger } from "nuqs";

export const PODIUM_YEAR_SEARCH_KEY = "year" as const;

export const PODIUM_YEAR_SEARCH = {
	year: parseAsInteger,
};
