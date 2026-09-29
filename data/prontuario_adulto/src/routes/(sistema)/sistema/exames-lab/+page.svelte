<script lang="ts">
  import { FlaskConical, Plus, Pencil, ToggleLeft, ToggleRight, Search } from 'lucide-svelte';
  import { apiFetch } from '$lib/api';
  import { invalidateAll } from '$app/navigation';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let busca = $state('');
  let modalAberto = $state(false);
  let editando = $state<any>(null);
  let salvando = $state(false);
  let form = $state({ 
    nome: '', 
    pacote: '', 
    unidade: '', 
    tipo: 'quantitativo',
    ref_min: null as number | null,
    ref_max: null as number | null,
    ref_min_m: null as number | null,
    ref_max_m: null as number | null,
    ref_min_f: null as number | null,
    ref_max_f: null as number | null,
    ref_texto: '',
    significado: '',
    separarSexo: false
  });

  let filtrados = $derived((data.exames || []).filter((e: any) => e.nome.toLowerCase().includes(busca.toLowerCase())));

  let agrupados = $derived.by(() => {
    const map: Record<string, any[]> = {};
    for (const e of filtrados) {
       const key = (e.pacote || 'Geral').trim();
       if (!map[key]) map[key] = [];
       map[key].push(e);
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
      .map(([pacote, exames]) => ({ pacote, exames }));
  });

  function abrirCriar() { 
    editando = null; 
    form = { 
      nome: '', pacote: '', unidade: '', tipo: 'quantitativo',
      ref_min: null, ref_max: null, 
      ref_min_m: null, ref_max_m: null, ref_min_f: null, ref_max_f: null,
      ref_texto: '', significado: '', separarSexo: false
    }; 
    modalAberto = true; 
  }
  
  function abrirEditar(e: any) { 
    editando = e; 
    const sepSexo = !!(e.ref_min_m || e.ref_max_m || e.ref_min_f || e.ref_max_f);
    form = { 
      nome: e.nome, 
      pacote: e.pacote || '', 
      unidade: e.unidade || '', 
      tipo: e.tipo === 'numerico' || e.tipo === 'quantitativo' ? 'quantitativo' : 'qualitativo',
      ref_min: e.ref_min ?? null,
      ref_max: e.ref_max ?? null,
      ref_min_m: e.ref_min_m ?? null,
      ref_max_m: e.ref_max_m ?? null,
      ref_min_f: e.ref_min_f ?? null,
      ref_max_f: e.ref_max_f ?? null,
      ref_texto: e.ref_texto || '',
      significado: e.significado || '',
      separarSexo: sepSexo
    }; 
    modalAberto = true; 
  }

  async function salvar() {
    salvando = true;
    try {
      const payload = { ...form };
      if (payload.tipo === 'qualitativo') {
         payload.ref_min = null; payload.ref_max = null;
         payload.ref_min_m = null; payload.ref_max_m = null;
         payload.ref_min_f = null; payload.ref_max_f = null;
      } else if (!payload.separarSexo) {
         payload.ref_min_m = null; payload.ref_max_m = null;
         payload.ref_min_f = null; payload.ref_max_f = null;
      } else {
         payload.ref_min = null; payload.ref_max = null;
      }
      
      if (editando) await apiFetch(`/api/v1/sistema/exames-lab/${editando.id}`, data.accessToken, { method: 'PUT', body: JSON.stringify(payload) });
      else await apiFetch('/api/v1/sistema/exames-lab', data.accessToken, { method: 'POST', body: JSON.stringify(payload) });
      modalAberto = false; await invalidateAll();
    } catch (e: any) { alert(e.message); } finally { salvando = false; }
  }
  async function toggle(id: string) { await apiFetch(`/api/v1/sistema/exames-lab/${id}/toggle`, data.accessToken, { method: 'PATCH' }); await invalidateAll(); }
</script>

<div class="space-y-6">
  <header class="flex items-center justify-between">
    <div><h1 class="text-2xl font-extrabold text-gray-900">Exames Laboratoriais</h1><p class="text-sm text-gray-500">Catálogo global de exames laboratoriais.</p></div>
    <button onclick={abrirCriar} class="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-xl text-sm font-bold hover:bg-cyan-700 shadow-sm"><Plus class="w-4 h-4" /> Novo Exame</button>
  </header>

  <div class="relative max-w-sm"><Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" bind:value={busca} placeholder="Buscar exame..." class="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-sm" /></div>

  <div class="space-y-8">
    {#each agrupados as { pacote, exames }}
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="bg-gray-50/80 px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-2.5">
            <span class="w-1.5 h-4 rounded bg-cyan-500"></span>
            {pacote}
            <span class="text-[10px] font-bold bg-cyan-100/70 text-cyan-700 px-2 py-0.5 rounded-full border border-cyan-200/30 shadow-xs">
              {exames.length} {exames.length === 1 ? 'exame' : 'exames'}
            </span>
          </h3>
        </div>
        
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-white text-gray-400 text-[10px] font-bold uppercase tracking-wider border-b border-gray-50">
              <th class="px-5 py-2.5 text-left font-black">Nome</th>
              <th class="px-5 py-2.5 text-left">Unidade</th>
              <th class="px-5 py-2.5 text-left">Ref.</th>
              <th class="px-5 py-2.5 text-center w-24">Status</th>
              <th class="px-5 py-2.5 text-right w-24">Ações</th>
            </tr>
          </thead>
          <tbody>
            {#each exames as e}
              <tr class="border-t border-gray-50 hover:bg-gray-50/40 transition-all">
                <td class="px-5 py-3 font-semibold text-gray-900 tracking-tight">{e.nome}</td>
                <td class="px-5 py-3 text-gray-600 text-xs font-medium">{e.unidade || '—'}</td>
                <td class="px-5 py-3 text-gray-500 text-xs font-mono">{e.valor_referencia || '—'}</td>
                <td class="px-5 py-3 text-center">
                   <span class="px-2 py-0.5 rounded-full text-[10px] font-black border uppercase {e.ativo ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' : 'bg-red-50 text-red-700 border-red-200/50'}">
                      {e.ativo ? 'Ativo' : 'Inativo'}
                   </span>
                </td>
                <td class="px-5 py-3 text-right">
                  <div class="flex items-center justify-end gap-3">
                    <button onclick={() => abrirEditar(e)} class="text-indigo-500 hover:text-indigo-700 transition-all active:scale-95" title="Editar"><Pencil class="w-4 h-4" /></button>
                    <button onclick={() => toggle(e.id)} class="active:scale-95" title={e.ativo ? 'Desativar' : 'Ativar'}>
                       {#if e.ativo}<ToggleRight class="w-5 h-5 text-green-500 transition-colors" />{:else}<ToggleLeft class="w-5 h-5 text-gray-400 transition-colors" />{/if}
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
       <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center flex flex-col items-center justify-center gap-2">
          <FlaskConical class="w-8 h-8 text-gray-300 mb-1" />
          <h4 class="text-gray-500 text-sm font-bold">Nenhum exame encontrado</h4>
          <p class="text-gray-400 text-xs max-w-xs">Tente ajustar sua busca ou adicione um novo exame ao catálogo.</p>
       </div>
    {/each}
  </div>
</div>

{#if modalAberto}
  <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto">
    <div class="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-full my-auto">
      <div class="p-5 border-b border-gray-100 shrink-0"><h3 class="text-lg font-bold">{editando ? 'Editar' : 'Novo'} Exame</h3></div>
      <div class="p-5 space-y-4 overflow-y-auto flex-1">
        <div><label class="text-xs font-bold text-gray-600 uppercase" for="el-n">Nome</label><input id="el-n" type="text" bind:value={form.nome} class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-cyan-500/20 outline-none" /></div>
        
        <div class="grid grid-cols-2 gap-3">
           <div><label class="text-xs font-bold text-gray-600 uppercase" for="el-p">Pacote</label><input id="el-p" type="text" bind:value={form.pacote} class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-cyan-500/20 outline-none" placeholder="Ex: Hemograma" /></div>
           <div><label class="text-xs font-bold text-gray-600 uppercase" for="el-t">Tipo</label>
              <select id="el-t" bind:value={form.tipo} class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-cyan-500/20 outline-none bg-white">
                 <option value="quantitativo">Numérico</option>
                 <option value="qualitativo">Qualitativo</option>
              </select>
           </div>
        </div>
        
        <div class="border border-gray-100 bg-gray-50/50 rounded-2xl p-4 space-y-3">
           <span class="text-[10px] font-black tracking-wider text-gray-400 uppercase">Referências & Métricas</span>
           
           <div class="grid grid-cols-2 gap-3">
              <div><label class="text-xs font-bold text-gray-600 uppercase" for="el-u">Unidade</label><input id="el-u" type="text" bind:value={form.unidade} class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-cyan-500/20 outline-none" placeholder="Ex: mg/dL" /></div>
              {#if form.tipo === 'qualitativo'}
                 <div><label class="text-xs font-bold text-gray-600 uppercase" for="el-txt">Texto Ref.</label><input id="el-txt" type="text" bind:value={form.ref_texto} class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-cyan-500/20 outline-none" placeholder="Ex: Negativo" /></div>
              {/if}
           </div>

           {#if form.tipo === 'quantitativo'}
              <div class="flex items-center gap-2 py-1">
                 <input type="checkbox" id="el-sep" bind:checked={form.separarSexo} class="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4" />
                 <label for="el-sep" class="text-xs font-semibold text-gray-700 select-none cursor-pointer">Separar limites de referência por sexo?</label>
              </div>

              {#if !form.separarSexo}
                 <div class="grid grid-cols-2 gap-3 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div><label class="text-[10px] font-bold text-gray-500 uppercase" for="el-min">Limite Mínimo</label><input id="el-min" type="number" step="any" bind:value={form.ref_min} class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-cyan-500/20 outline-none" placeholder="Nenhum" /></div>
                    <div><label class="text-[10px] font-bold text-gray-500 uppercase" for="el-max">Limite Máximo</label><input id="el-max" type="number" step="any" bind:value={form.ref_max} class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-cyan-500/20 outline-none" placeholder="Nenhum" /></div>
                 </div>
              {:else}
                 <div class="space-y-3 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div class="bg-blue-50/30 p-3 rounded-xl border border-blue-100/50">
                       <span class="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider flex items-center gap-1 mb-2">♂️ Masculino</span>
                       <div class="grid grid-cols-2 gap-3">
                          <div><label class="text-[9px] font-bold text-gray-500 uppercase" for="el-minm">Mínimo M</label><input id="el-minm" type="number" step="any" bind:value={form.ref_min_m} class="w-full mt-0.5 border border-gray-200 rounded-xl p-2 text-sm bg-white" placeholder="Min" /></div>
                          <div><label class="text-[9px] font-bold text-gray-500 uppercase" for="el-maxm">Máximo M</label><input id="el-maxm" type="number" step="any" bind:value={form.ref_max_m} class="w-full mt-0.5 border border-gray-200 rounded-xl p-2 text-sm bg-white" placeholder="Max" /></div>
                       </div>
                    </div>
                    <div class="bg-pink-50/30 p-3 rounded-xl border border-pink-100/50">
                       <span class="text-[10px] font-extrabold text-pink-600 uppercase tracking-wider flex items-center gap-1 mb-2">♀️ Feminino</span>
                       <div class="grid grid-cols-2 gap-3">
                          <div><label class="text-[9px] font-bold text-gray-500 uppercase" for="el-minf">Mínimo F</label><input id="el-minf" type="number" step="any" bind:value={form.ref_min_f} class="w-full mt-0.5 border border-gray-200 rounded-xl p-2 text-sm bg-white" placeholder="Min" /></div>
                          <div><label class="text-[9px] font-bold text-gray-500 uppercase" for="el-maxf">Máximo F</label><input id="el-maxf" type="number" step="any" bind:value={form.ref_max_f} class="w-full mt-0.5 border border-gray-200 rounded-xl p-2 text-sm bg-white" placeholder="Max" /></div>
                       </div>
                    </div>
                 </div>
              {/if}
           {/if}
        </div>
        
        <div>
           <label class="text-xs font-bold text-gray-600 uppercase flex items-center justify-between" for="el-s">
              Significado do Exame 
              <span class="text-[10px] text-gray-400 lowercase italic normal-case">(exibido como tooltip)</span>
           </label>
           <textarea id="el-s" bind:value={form.significado} rows="3" class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-cyan-500/20 outline-none resize-none" placeholder="Explicação clínica do exame e de suas variações..."></textarea>
        </div>
      </div>
      <div class="p-5 bg-gray-50 border-t flex justify-end gap-3 rounded-b-2xl shrink-0">
        <button onclick={() => modalAberto = false} class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
        <button onclick={salvar} disabled={salvando} class="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-all shadow-sm active:scale-[0.98]">{salvando ? 'Salvando...' : 'Salvar Exame'}</button>
      </div>
    </div>
  </div>
{/if}
