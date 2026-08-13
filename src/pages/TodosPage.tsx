import { useTodos } from "@/hooks/todos/use-todos";

export function TodosPage() {
	const { data: todos, isPending, isError, error } = useTodos();

	if (isPending) {
		return <p>Carregando tarefas...</p>;
	}

	if (isError) {
		return <p>Erro ao carregar tarefas: {error.message}</p>;
	}

	return (
		<main>
			<h1 className="mb-4 text-2xl font-semibold">Tarefas</h1>
			{todos.length === 0 && <p>Nenhuma tarefa encontrada.</p>}
			{todos.length > 0 && (
				<ul className="list-disc space-y-1 pl-5">
					{todos.map((todo) => (
						<li key={todo.id}>{todo.name}</li>
					))}
				</ul>
			)}
		</main>
	);
}
