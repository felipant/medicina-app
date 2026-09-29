import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export interface MedicamentoItem {
	id: number;
	principio_ativo_id: number;
	principio_ativo: string;
	nome_comercial?: string;
	concentracao: string;
	forma_farmaceutica: string;
	via_administracao: string;
	classe_terapeutica?: string;
}

export interface PrincipioAtivoItem {
	id: number;
	nome: string;
}

export const GET: RequestHandler = async ({ url, platform }) => {
	const query = url.searchParams.get('q')?.trim() || '';
	if (query.length < 2) {
		return json({ medicamentos: [], principios_ativos: [] });
	}

	const env = platform?.env as any;
	const db = env?.medicina_app_db;

	if (!db) {
		console.warn('D1 database binding "medicina_app_db" not found in platform.env');
		return json({ medicamentos: [], principios_ativos: [] });
	}

	try {
		const terms = query.split(/\s+/).filter(Boolean);
		const firstTerm = terms[0];
		const exactTerm = query.toUpperCase();
		const startsWithTerm = `${firstTerm.toUpperCase()}%`;
		const containsTerm = `%${firstTerm.toUpperCase()}%`;

		// Busca apresentações vinculadas ao princípio ativo
		const conditions: string[] = [];
		const params: any[] = [];
		let paramIndex = 1;

		for (const term of terms) {
			const t = `%${term}%`;
			conditions.push(
				`(pa.nome LIKE ?${paramIndex} OR a.concentracao LIKE ?${paramIndex} OR a.forma_farmaceutica LIKE ?${paramIndex} OR a.via_administracao LIKE ?${paramIndex})`
			);
			params.push(t);
			paramIndex++;
		}

		const whereSql = conditions.join(' AND ');
		const exactParam = paramIndex++;
		const startsParam = paramIndex++;
		const containsParam = paramIndex++;
		params.push(exactTerm, startsWithTerm, containsTerm);

		const medsSql = `
			SELECT 
				a.id,
				pa.id as principio_ativo_id,
				pa.nome as principio_ativo,
				COALESCE(a.concentracao, '') as concentracao,
				COALESCE(a.forma_farmaceutica, '') as forma_farmaceutica,
				COALESCE(a.via_administracao, '') as via_administracao,
				COALESCE(c.descricao, '') as classe_terapeutica
			FROM apresentacoes a
			JOIN principios_ativos pa ON a.principio_ativo_id = pa.id
			LEFT JOIN classes_terapeuticas c ON a.classe_terapeutica_id = c.id
			WHERE ${whereSql}
			ORDER BY 
				CASE 
					WHEN UPPER(pa.nome) = ?${exactParam} THEN 0 
					WHEN UPPER(pa.nome) LIKE ?${startsParam} THEN 1
					WHEN UPPER(pa.nome) LIKE ?${containsParam} THEN 2
					ELSE 3
				END,
				pa.nome ASC,
				a.forma_farmaceutica ASC,
				a.concentracao ASC
			LIMIT 50
		`;

		const medsResult = await db.prepare(medsSql).bind(...params).all();

		const uniquePaMap = new Map<number, string>();

		const medicamentos: MedicamentoItem[] = (medsResult.results || []).map((r: any) => {
			if (r.principio_ativo_id && r.principio_ativo && !uniquePaMap.has(r.principio_ativo_id)) {
				uniquePaMap.set(r.principio_ativo_id, r.principio_ativo);
			}

			return {
				id: r.id,
				principio_ativo_id: r.principio_ativo_id,
				principio_ativo: r.principio_ativo,
				nome_comercial: r.principio_ativo,
				concentracao: r.concentracao,
				forma_farmaceutica: r.forma_farmaceutica,
				via_administracao: r.via_administracao,
				classe_terapeutica: r.classe_terapeutica
			};
		});

		const principios_ativos: PrincipioAtivoItem[] = Array.from(uniquePaMap.entries()).map(
			([id, nome]) => ({ id, nome })
		);

		return json({ medicamentos, principios_ativos });
	} catch (e) {
		console.error('Error searching medications in D1:', e);
		return json({ medicamentos: [], principios_ativos: [] }, { status: 500 });
	}
};
