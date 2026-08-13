import { supabase } from "@/lib/supabase";

export type Todo = {
	id: string | number;
	name: string;
};

export async function listTodos(): Promise<Todo[]> {
	const { data, error } = await supabase.from("todos").select();

	if (error) {
		throw error;
	}

	if (!Array.isArray(data)) {
		throw new Error("todos: expected array");
	}

	return data;
}
