import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface MedicamentoResult {
	id: number;
	nome: string;
	tipo: 'produto' | 'principio_ativo';
	tipo_produto?: string;
	substancia?: string;
}

export const GET: RequestHandler = async ({ url, platform }) => {
	const query = url.searchParams.get('q')?.trim() || '';
	if (query.length < 2) {
		return json({ produtos: [], principios_ativos: [] });
	}

	const env = platform?.env as any;
	const db = env?.medicina_app_db;

	if (!db) {
		return json({ produtos: [], principios_ativos: [] });
	}

	try {
		const searchTerm = `%${query}%`;
		const startsWithTerm = `${query}%`;

		// Busca produtos por nome comercial ou princípio ativo contido em substancia_raw
		const produtosResult = await db
			.prepare(
				`SELECT id, nome_comercial as nome, tipo_produto, substancia_raw as substancia
				 FROM produtos
				 WHERE nome_comercial LIKE ?1 OR substancia_raw LIKE ?1
				 ORDER BY 
				   CASE 
				     WHEN nome_comercial LIKE ?2 THEN 0 
				     WHEN nome_comercial LIKE ?1 THEN 1
				     ELSE 2 
				   END,
				   nome_comercial ASC
				 LIMIT 20`
			)
			.bind(searchTerm, startsWithTerm)
			.all();

		// Busca princípios ativos
		const principiosResult = await db
			.prepare(
				`SELECT DISTINCT id, nome
				 FROM principios_ativos
				 WHERE nome LIKE ?1
				 ORDER BY 
				   CASE 
				     WHEN nome LIKE ?2 THEN 0 
				     ELSE 1 
				   END,
				   nome ASC
				 LIMIT 20`
			)
			.bind(searchTerm, startsWithTerm)
			.all();

		const produtos: MedicamentoResult[] = (produtosResult.results || []).map((r: any) => ({
			id: r.id,
			nome: r.nome,
			tipo: 'produto' as const,
			tipo_produto: r.tipo_produto || '',
			substancia: r.substancia || ''
		}));

		const principios_ativos: MedicamentoResult[] = (principiosResult.results || []).map(
			(r: any) => ({
				id: r.id,
				nome: r.nome,
				tipo: 'principio_ativo' as const
			})
		);

		return json({ produtos, principios_ativos });
	} catch (e) {
		console.error('Error searching medications in D1:', e);
		return json({ produtos: [], principios_ativos: [] }, { status: 500 });
	}
};
