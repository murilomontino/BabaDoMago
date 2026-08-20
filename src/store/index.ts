import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
	FLUSH,
	PAUSE,
	PERSIST,
	PURGE,
	persistReducer,
	persistStore,
	REGISTER,
	REHYDRATE,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import createSagaMiddleware from "redux-saga";
import { MATCH_CLOCK_STORAGE_KEY } from "@/const/championship-event-match";
import { MATCH_OPS_STORAGE_KEY } from "@/const/championship-event-match-ops";
import { matchClockReducer } from "@/store/match-clock/slice";
import { matchOpsReducer } from "@/store/match-ops/slice";
import { rootSaga } from "@/store/root-saga";

const matchClockPersistConfig = {
	key: MATCH_CLOCK_STORAGE_KEY,
	storage,
	whitelist: ["clocks", "deferredClear"],
};

const matchOpsPersistConfig = {
	key: MATCH_OPS_STORAGE_KEY,
	storage,
	whitelist: ["queues", "seq"],
};

const rootReducer = combineReducers({
	matchClock: persistReducer(matchClockPersistConfig, matchClockReducer),
	matchOps: persistReducer(matchOpsPersistConfig, matchOpsReducer),
});

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
	reducer: rootReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
			},
		}).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
