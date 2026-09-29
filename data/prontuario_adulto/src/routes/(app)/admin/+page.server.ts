import { apiFetch } from '$lib/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const token = locals.session!.access_token;

  try {
    const dashboard = await apiFetch<any>('/api/v1/admin/dashboard', token);
    return {
      estatisticas: {
        pacientes: dashboard.total_pacientes ?? 0,
        usuarios: dashboard.total_usuarios ?? 0,
        consultasMes: dashboard.consultas_este_mes ?? 0,
      }
    };
  } catch (err) {
    return {
      estatisticas: {
        pacientes: 0,
        usuarios: 0,
        consultasMes: 0,
      }
    };
  }
};
