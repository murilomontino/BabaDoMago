import { parseAsStringEnum } from "nuqs";
import {
	EVENT_BUILDER_STEP,
	type EventBuilderStep,
} from "./championship-event.ts";

export const EVENT_BUILDER_SEARCH_KEY = "step" as const;

export const EVENT_BUILDER_SEARCH = {
	step: parseAsStringEnum<EventBuilderStep>(Object.values(EVENT_BUILDER_STEP)),
};
