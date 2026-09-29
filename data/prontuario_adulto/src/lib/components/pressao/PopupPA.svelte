<script lang="ts">
  import { X, Loader2, ChevronRight, ChevronLeft } from 'lucide-svelte';
  import { apiFetch } from '$lib/api';
  import CelulaPA from './CelulaPA.svelte';

  interface Props {
    pacienteId: string;
    accessToken: string;
    aberto: boolean;
    onsaved?: () => void;
  }

  let { pacienteId, accessToken, aberto = $bindable(), onsaved }: Props = $props();

  // Step 1: Configuration
  let etapa = $state<1 | 2>(1);
  let dataInicio = $state(new Date().toISOString().split('T')[0]);
  let dataFim = $state(new Date().toISOString().split('T')[0]);
  let frequencia = $state<'1' | '3'>('3');
  let salvando = $state(false);

  // Step 2: Grid
  type CelulaData = { ps: number | null; pd: number | null };
  let grade = $state<Record<string, Record<string, CelulaData>>>({});
  let diasDaSerie = $state<string[]>([]);

  const horariosDoDia = $derived(frequencia === '3' ? ['manha', 'tarde', 'noite'] : ['unica']);
  const horarioLabel: Record<string, string> = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite', unica: 'Medida' };

  function gerarGrade() {
    const start = new Date(dataInicio + 'T12:00:00');
    const end = new Date(dataFim + 'T12:00:00');
    const dias: string[] = [];
    const novaGrade: typeof grade = {};

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0];
      dias.push(key);
      novaGrade[key] = {};
      for (const h of (frequencia === '3' ? ['manha', 'tarde', 'noite'] : ['unica'])) {
        novaGrade[key][h] = { ps: null, pd: null };
      }
    }
    diasDaSerie = dias;
    grade = novaGrade;
    etapa = 2;
  }

  function formatarData(d: string) {
    const [y, m, dd] = d.split('-');
    return `${dd}/${m}`;
  }

  function diaDaSemana(d: string) {
    const dt = new Date(d + 'T12:00:00');
    return dt.toLocaleDateString('pt-BR', { weekday: 'short' });
  }

  async function salvar() {
    salvando = true;
    try {
      const medicoes: any[] = [];
      for (const dia of diasDaSerie) {
        for (const horario of (frequencia === '3' ? ['manha', 'tarde', 'noite'] : ['unica'])) {
          const cel = grade[dia]?.[horario];
          if (cel?.ps && cel?.pd) {
            medicoes.push({
              paciente_id: pacienteId,
              data_medicao: dia,
              horario,
              ps: cel.ps,
              pd: cel.pd,
            });
          }
        }
      }

      if (medicoes.length === 0) {
        alert('Preencha pelo menos uma medida.');
        salvando = false;
        return;
      }

      await apiFetch('/api/v1/pressao/lote', accessToken, {
        method: 'POST',
        body: JSON.stringify({ paciente_id: pacienteId, medicoes })
      });

      aberto = false;
      if (onsaved) onsaved();
    } catch (e: any) {
      alert(e.message || 'Erro ao salvar medidas.');
    } finally {
      salvando = false;
    }
  }
</script>

{#if aberto}
  <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4 backdrop-blur-sm">
    <div class="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[85vh] flex flex-col">
      <!-- Header -->
      <div class="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div>
          <h3 class="text-lg font-bold text-gray-900">Pressão Arterial Seriada</h3>
          <p class="text-xs text-gray-500 mt-0.5">Etapa {etapa} de 2 — {etapa === 1 ? 'Configuração' : 'Preenchimento'}</p>
        </div>
        <button onclick={() => aberto = false} class="text-gray-400 hover:text-gray-600 transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-5 overflow-y-auto flex-1">
        {#if etapa === 1}
          <div class="space-y-5">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-bold text-gray-600 uppercase" for="pa-di">Data de início</label>
                <input id="pa-di" type="date" bind:value={dataInicio} class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-sm" />
              </div>
              <div>
                <label class="text-xs font-bold text-gray-600 uppercase" for="pa-df">Data de fim</label>
                <input id="pa-df" type="date" bind:value={dataFim} class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-sm" />
              </div>
            </div>

            <div>
              <label class="text-xs font-bold text-gray-600 uppercase">Medidas por dia</label>
              <div class="flex gap-3 mt-2">
                <button onclick={() => frequencia = '1'}
                  class="flex-1 py-2.5 text-sm font-medium rounded-xl border-2 transition-all
                         {frequencia === '1' ? 'bg-blue-50 text-blue-700 border-blue-500' : 'border-gray-200 text-gray-500 hover:border-gray-300'}">
                  1 por dia
                </button>
                <button onclick={() => frequencia = '3'}
                  class="flex-1 py-2.5 text-sm font-medium rounded-xl border-2 transition-all
                         {frequencia === '3' ? 'bg-blue-50 text-blue-700 border-blue-500' : 'border-gray-200 text-gray-500 hover:border-gray-300'}">
                  3 por dia (M / T / N)
                </button>
              </div>
            </div>

            <button onclick={gerarGrade}
              class="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2">
              Próximo <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        {:else}
          <div class="space-y-4">
            <button onclick={() => etapa = 1} class="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
              <ChevronLeft class="w-3.5 h-3.5" /> Voltar
            </button>

            <div class="overflow-x-auto rounded-xl border border-gray-200">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-gray-50">
                    <th class="px-3 py-2.5 text-left text-xs font-bold text-gray-500 uppercase">Data</th>
                    {#each horariosDoDia as h}
                      <th class="px-3 py-2.5 text-center text-xs font-bold text-gray-500 uppercase">{horarioLabel[h]}</th>
                    {/each}
                  </tr>
                </thead>
                <tbody>
                  {#each diasDaSerie as dia}
                    <tr class="border-t border-gray-100">
                      <td class="px-3 py-2 text-gray-700 whitespace-nowrap">
                        <span class="text-xs font-bold">{formatarData(dia)}</span>
                        <span class="text-[10px] text-gray-400 ml-1">{diaDaSemana(dia)}</span>
                      </td>
                      {#each horariosDoDia as horario}
                        <td class="px-2 py-1.5 text-center">
                          {#if grade[dia]?.[horario]}
                            <CelulaPA bind:ps={grade[dia][horario].ps} bind:pd={grade[dia][horario].pd} />
                          {/if}
                        </td>
                      {/each}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>

            <p class="text-[10px] text-gray-400">PS / PD em mmHg. Deixe em branco os dias sem medição.</p>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      {#if etapa === 2}
        <div class="p-5 border-t border-gray-100 flex justify-end shrink-0">
          <button onclick={salvar} disabled={salvando}
            class="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2 transition-colors">
            {#if salvando}
              <Loader2 class="w-4 h-4 animate-spin" /> Salvando...
            {:else}
              Salvar medidas
            {/if}
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}
