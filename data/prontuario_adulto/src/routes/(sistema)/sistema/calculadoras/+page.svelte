<script lang="ts">
  import { apiFetch } from '$lib/api';
  import { Plus, Edit, Trash2, Check, X, ExternalLink, Calculator, Tag, Move, Loader2 } from 'lucide-svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let { data }: { data: any } = $props();

  let listagem = $state<any[]>(data.calculadoras || []);
  let accessToken = $derived($page.data.accessToken);

  let showModal = $state(false);
  let editandoId = $state<string | null>(null);
  let salvando = $state(false);

  let form = $state({
    nome: '',
    descricao: '',
    categoria: 'Cardiologia',
    tipo: 'link_externo' as const,
    url_externa: '',
    tagsTexto: '',
    ativo: true,
    ordem: 0
  });

  function abrirNovo() {
    editandoId = null;
    form = {
      nome: '',
      descricao: '',
      categoria: 'Geral',
      tipo: 'link_externo',
      url_externa: '',
      tagsTexto: '',
      ativo: true,
      ordem: listagem.length + 1
    };
    showModal = true;
  }

  function abrirEditar(item: any) {
    editandoId = item.id;
    form = {
      nome: item.nome,
      descricao: item.descricao || '',
      categoria: item.categoria,
      tipo: 'link_externo',
      url_externa: item.url_externa || '',
      tagsTexto: (item.tags || []).join(', '),
      ativo: item.ativo,
      ordem: item.ordem
    };
    showModal = true;
  }

  async function salvar() {
    if (!form.nome || !form.categoria) {
      alert("Nome e Categoria são campos obrigatórios.");
      return;
    }

    const payload = {
      nome: form.nome,
      descricao: form.descricao || null,
      categoria: form.categoria,
      tipo: 'link_externo',
      url_externa: form.url_externa || null,
      identificador_local: null,
      tags: form.tagsTexto.split(',').map(t => t.trim()).filter(t => t.length > 0),
      ativo: form.ativo,
      ordem: form.ordem
    };

    salvando = true;
    try {
      if (editandoId) {
        // PUT
        const updated = await apiFetch<any>(`/api/v1/calculadoras/${editandoId}`, accessToken, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        
        listagem = listagem.map(l => l.id === editandoId ? updated : l);
      } else {
        // POST
        const created = await apiFetch<any>('/api/v1/calculadoras/', accessToken, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        listagem = [...listagem, created];
      }
      
      listagem = listagem.sort((a, b) => a.ordem - b.ordem);
      showModal = false;
    } catch (err) {
      console.error(err);
      alert("Falha ao gravar calculadora.");
    } finally {
      salvando = false;
    }
  }

  async function excluir(id: string) {
    if (!confirm("Tem certeza que deseja remover permanentemente esta calculadora?")) return;
    try {
      await apiFetch(`/api/v1/calculadoras/${id}`, accessToken, {
        method: 'DELETE'
      });
      listagem = listagem.filter(l => l.id !== id);
    } catch (err) {
      console.error(err);
      alert("Falha ao excluir.");
    }
  }
</script>

<div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6 animate-in fade-in duration-300">
  <!-- HEADER -->
  <header class="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div class="flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
        <Calculator class="w-6 h-6" />
      </div>
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight">Calculadoras de Decisão</h1>
        <p class="text-slate-400 text-sm mt-0.5">Gerenciamento de escores de risco, fórmulas clínicas e fluxogramas locais ou externos.</p>
      </div>
    </div>
    <button 
      onclick={abrirNovo}
      class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
    >
      <Plus class="w-4 h-4 stroke-[3]" /> Nova Calculadora
    </button>
  </header>

  <!-- LIST GRID/TABLE -->
  <div class="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-slate-100 bg-slate-50/50">
            <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider w-16">Ordem</th>
            <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Calculadora</th>
            <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Categoria</th>
            <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Link Externo</th>
            <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Tags</th>
            <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
            <th class="px-6 py-4 text-right text-xs font-black text-slate-500 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#each listagem as calc}
            <tr class="hover:bg-slate-50/50 transition-colors">
              <td class="px-6 py-4 font-bold text-slate-700">
                <span class="px-2.5 py-1 bg-slate-100 rounded-lg text-xs border border-slate-200/60">
                  {calc.ordem}
                </span>
              </td>
              <td class="px-6 py-4">
                <div>
                  <p class="text-sm font-extrabold text-slate-900">{calc.nome}</p>
                  {#if calc.descricao}
                    <p class="text-xs text-slate-500 max-w-md line-clamp-2 mt-0.5">{calc.descricao}</p>
                  {/if}
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  {calc.categoria}
                </span>
              </td>
              <td class="px-6 py-4">
                {#if calc.url_externa}
                  <a href={calc.url_externa} target="_blank" class="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg px-2.5 py-1 transition-all shadow-xs max-w-[160px] truncate">
                    <ExternalLink class="w-3.5 h-3.5" /> Acessar Link
                  </a>
                {:else}
                  <span class="text-slate-400 text-xs italic">—</span>
                {/if}
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1 max-w-[200px]">
                  {#each (calc.tags || []) as t}
                    <span class="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/40">#{t}</span>
                  {/each}
                </div>
              </td>
              <td class="px-6 py-4">
                {#if calc.ativo}
                  <span class="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-200">
                    <Check class="w-3.5 h-3.5 stroke-[3]" /> Ativo
                  </span>
                {:else}
                  <span class="inline-flex items-center gap-1 text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full text-xs font-bold border border-slate-200">
                    <X class="w-3.5 h-3.5" /> Inativo
                  </span>
                {/if}
              </td>
              <td class="px-6 py-4 text-right">
                <div class="inline-flex items-center gap-2">
                  <button onclick={() => abrirEditar(calc)} class="p-2 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-xl border border-transparent hover:border-amber-200 transition-all">
                    <Edit class="w-4 h-4" />
                  </button>
                  <button onclick={() => excluir(calc.id)} class="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl border border-transparent hover:border-red-200 transition-all">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="7" class="px-6 py-20 text-center text-slate-400 text-sm font-medium">
                Nenhuma calculadora cadastrada no banco. Clique em "Nova Calculadora" para inserir.
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- MODAL DE EDIÇÃO -->
{#if showModal}
  <div class="fixed inset-0 z-[1000] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
    <div class="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
      
      <div class="p-6 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
        <div>
          <h3 class="text-lg font-extrabold text-slate-900">{editandoId ? 'Editar Calculadora' : 'Nova Calculadora'}</h3>
          <p class="text-xs text-slate-500">Configure o motor de decisão clínica.</p>
        </div>
        <button onclick={() => showModal = false} class="p-2 rounded-full text-slate-400 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-6 space-y-4 overflow-y-auto">
        <!-- NOME -->
        <div class="space-y-1">
          <label class="text-xs font-extrabold text-slate-700 uppercase tracking-wide">Nome da Calculadora *</label>
          <input type="text" bind:value={form.nome} placeholder="Ex: Risco Cardiovascular Framingham" class="w-full text-sm border-slate-200 rounded-xl" />
        </div>

        <!-- DESCRIÇÃO -->
        <div class="space-y-1">
          <label class="text-xs font-extrabold text-slate-700 uppercase tracking-wide">Descrição Curta</label>
          <textarea bind:value={form.descricao} rows="2" placeholder="Ex: Predição de IAM em 10 anos..." class="w-full text-sm border-slate-200 rounded-xl"></textarea>
        </div>

        <!-- CATEGORIA + ORDEM -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-extrabold text-slate-700 uppercase tracking-wide">Categoria</label>
            <input type="text" bind:value={form.categoria} placeholder="Cardiologia" class="w-full text-sm border-slate-200 rounded-xl" />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-extrabold text-slate-700 uppercase tracking-wide">Ordem</label>
            <input type="number" bind:value={form.ordem} class="w-full text-sm border-slate-200 rounded-xl" />
          </div>
        </div>

        <hr class="border-slate-100 my-2" />

        <!-- URL EXTERNA -->
        <div class="space-y-1 animate-in slide-in-from-top-2 duration-200">
          <label class="text-xs font-extrabold text-slate-700 uppercase tracking-wide flex items-center gap-1"><ExternalLink class="w-3.5 h-3.5 text-sky-500" /> URL da Calculadora Externa *</label>
          <input type="url" bind:value={form.url_externa} placeholder="https://www.mdcalc.com/calc/..." class="w-full text-sm border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20" required />
        </div>

        <!-- TAGS -->
        <div class="space-y-1">
          <label class="text-xs font-extrabold text-slate-700 uppercase tracking-wide flex items-center gap-1"><Tag class="w-3.5 h-3.5" /> Tags (separadas por vírgula)</label>
          <input type="text" bind:value={form.tagsTexto} placeholder="infarto, IAM, cardio, lipidios" class="w-full text-sm border-slate-200 rounded-xl" />
        </div>

        <!-- ATIVO -->
        <label class="flex items-center gap-2 cursor-pointer select-none py-2">
          <input type="checkbox" bind:checked={form.ativo} class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
          <span class="text-xs font-black text-slate-700 uppercase">Exibir esta calculadora para os clínicos</span>
        </label>
      </div>

      <div class="p-6 border-t border-slate-200/80 bg-slate-50 flex justify-end gap-3">
        <button onclick={() => showModal = false} class="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
        <button 
          onclick={salvar}
          disabled={salvando}
          class="px-6 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-600 text-white font-black text-xs rounded-xl inline-flex items-center gap-2 shadow-md transition-all"
        >
          {#if salvando}
            <Loader2 class="w-3.5 h-3.5 animate-spin" /> Salvando...
          {:else}
            <Check class="w-3.5 h-3.5 stroke-[3]" /> Gravar Registro
          {/if}
        </button>
      </div>

    </div>
  </div>
{/if}
