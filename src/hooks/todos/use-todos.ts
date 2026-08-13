import { useQuery } from "@tanstack/react-query";
import { listTodos } from "@/services/todos";
import { TODOS_QUERY_KEY } from "./todos-query-keys";

export function useTodos() {
	return useQuery({
		queryKey: TODOS_QUERY_KEY,
		queryFn: listTodos,
	});
}
