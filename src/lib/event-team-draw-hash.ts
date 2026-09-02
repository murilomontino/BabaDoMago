/**
 * Gera um hash SHA-256 hex dos dados de entrada + seed + versao do algoritmo,
 * servindo como fingerprint auditavel do sorteio.
 */
export async function eventTeamDrawHash(input: {
	seed: number;
	algorithmVersion: number;
	players: readonly { id: number; rating: number }[];
	playersPerTeam: number;
	volunteerIds: readonly number[];
}): Promise<string> {
	const payload = JSON.stringify({
		seed: input.seed,
		algorithmVersion: input.algorithmVersion,
		players: [...input.players].sort((a, b) => a.id - b.id),
		playersPerTeam: input.playersPerTeam,
		volunteerIds: [...input.volunteerIds].sort((a, b) => a - b),
	});
	const data = new TextEncoder().encode(payload);
	const buffer = await crypto.subtle.digest("SHA-256", data);
	return Array.from(new Uint8Array(buffer))
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}
