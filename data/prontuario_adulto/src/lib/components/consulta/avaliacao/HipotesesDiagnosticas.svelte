<script lang="ts">
  import { ClipboardList, Plus, Trash2, Link, Layers, History } from 'lucide-svelte';
  import { apiFetch } from '$lib/api';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  
  interface Props {
    dados: any;
    readonly?: boolean;
    onchange?: () => void;
    dadosSubjetivo?: any;
    blocos?: any[];
    prontuarioId?: string;
  }

  let { 
    dados = $bindable(), 
    readonly = false, 
    onchange, 
    dadosSubjetivo = {}, 
    blocos = [],
    prontuarioId = undefined
  }: Props = $props();

  if (!dados.hipoteses_diagnosticas) dados.hipoteses_diagnosticas = { itens: [] };
  let hd = $derived(dados.hipoteses_diagnosticas);

  let carryoverDiagnosticos = $state<any[]>([]);

  onMount(async () => {
     try {
        const token = $page.data.token || localStorage.getItem("token");
        if (prontuarioId && token) {
           const res = await apiFetch<any>(`/api/v1/diagnosticos/carryover/${prontuarioId}`, token);
           carryoverDiagnosticos = res.diagnosticos_anteriores || [];
        }
     } catch (e) {
        console.error("Erro carryover diag", e);
     }
  });

  // Derivar automaticamente os diagnósticos informados anteriormente no Subjetivo
  let itensSubjetivo = $derived.by(() => {
    const autoList: { cid: string; descricao: string; status: string; origem: 'HPP' | 'HDA' | 'Anterior' }[] = [];
    
    // 1. Doenças Crônicas do HPP
    const doencasHPP = dadosSubjetivo?.hpp?.doencas_estratificadas || [];
    doencasHPP.forEach((d: any) => {
      if (d.subcat) {
        if (!autoList.some(item => item.cid === d.subcat)) {
          autoList.push({
            cid: d.subcat,
            descricao: d.subcat_desc || d.cat_desc || 'Doença Crônica',
            status: 'Crônico',
            origem: 'HPP'
          });
        }
      }
    });

    // 2. CIDs vinculados às queixas de HDA
    const blocosHDA = blocos || [];
    blocosHDA.forEach((b: any) => {
      if (b.cid_subcat) {
        if (!autoList.some(item => item.cid === b.cid_subcat)) {
          autoList.push({
            cid: b.cid_subcat,
            descricao: b.cid_descricao || b.titulo || 'Queixa de HDA',
            status: 'Em Investigação',
            origem: 'HDA'
          });
        }
      }
    });

    // 3. Diagnósticos da consulta anterior (Carryover)
    carryoverDiagnosticos.forEach((d: any) => {
       if (d.cid_subcat && !autoList.some(item => item.cid === d.cid_subcat)) {
          autoList.push({
             cid: d.cid_subcat,
             descricao: d.cid_descricao || d.descricao_livre || 'Diagnóstico Anterior',
             status: d.status_resolucao === 'ativo' ? 'Crônico' : 'Suspeito',
             origem: 'Anterior'
          });
       }
    });

    return autoList;
  });

  function add() {
    dados.hipoteses_diagnosticas.itens.push({ cid: '', descricao: '', status: 'Suspeito' });
    onchange?.();
  }

  function addFromAuto(item: { cid: string; descricao: string; status: string }) {
    if (!hd.itens.some((it: any) => it.cid === item.cid)) {
      dados.hipoteses_diagnosticas.itens.push({ 
        cid: item.cid, 
        descricao: item.descricao, 
        status: item.status === 'Crônico' ? 'Crônico' : 'Suspeito' 
      });
      onchange?.();
    }
  }
</script>

<div class="space-y-5">
  
  <!-- 🔄 LISTA AUTOMÁTICA DO SUBJETIVO -->
  {#if itensSubjetivo.length > 0}
    <div class="bg-indigo-50/40 border border-indigo-100 rounded-2xl overflow-hidden shadow-sm transition-all">
      <div class="bg-indigo-100/50 px-5 py-3 border-b border-indigo-100 flex items-center justify-between">
        <div class="flex items-center gap-2.5 text-indigo-950 font-black text-xs uppercase tracking-wider">
          <Layers class="w-4 h-4 text-indigo-600 animate-pulse" />
          Diagnósticos Coletados do Subjetivo (Automático)
        </div>
        <span class="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full">Sincronizado</span>
      </div>

      <div class="p-4 space-y-2 bg-white/50">
        {#each itensSubjetivo as item}
          <div class="flex items-center justify-between bg-white/80 p-3 rounded-xl border border-indigo-100/60 shadow-xs group hover:bg-white transition-all">
            <div class="flex items-center gap-3 flex-1">
              <span class="w-18 flex items-center justify-center font-mono font-black bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg border border-indigo-100 text-xs tracking-wide">{item.cid}</span>
              <div class="min-w-0">
                <p class="text-slate-800 text-xs font-bold leading-tight truncate">{item.descricao}</p>
                <p class="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full {item.origem === 'HPP' ? 'bg-teal-500' : item.origem === 'Anterior' ? 'bg-indigo-500' : 'bg-amber-500'}"></span>
                  Origem: {item.origem === 'HPP' ? 'Histórico Pregresso (Crônica)' : item.origem === 'Anterior' ? 'Consulta Anterior (Continuidade)' : 'Anamnese / HDA'}
                </p>
              </div>
            </div>
            
            <div class="flex items-center gap-3">
              <span class="text-[10px] px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-800 font-extrabold uppercase tracking-wider rounded-md">{item.status}</span>
              {#if !hd.itens.some((it: any) => it.cid === item.cid) && !readonly}
                <button 
                  type="button" 
                  onclick={() => addFromAuto(item)} 
                  class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] bg-white border border-slate-250 hover:bg-slate-50 hover:text-indigo-600 px-2 py-1 rounded-lg font-bold shadow-xs"
                  title="Copiar para edição manual"
                >
                  <Plus class="w-3 h-3" /> Editar
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- 📝 LISTA MANUAL / HIPÓTESES DA AVALIAÇÃO -->
  <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
    <div class="bg-slate-50/80 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
      <div class="flex items-center gap-2 text-slate-800 font-black text-xs uppercase tracking-wider">
        <ClipboardList class="w-4 h-4 text-slate-600" /> 
        Diagnósticos Estabelecidos na Avaliação
      </div>
      <button 
        type="button" 
        onclick={add} 
        disabled={readonly} 
        class="bg-white border border-slate-300 hover:border-purple-400 hover:bg-purple-50 text-slate-700 hover:text-purple-700 transition-all text-xs font-extrabold flex items-center gap-1.5 px-3 py-1.5 rounded-xl shadow-xs"
      >
        <Plus class="w-3.5 h-3.5" /> Novo Diagnóstico
      </button>
    </div>

    <div class="p-5 space-y-3">
      {#each hd.itens as it, idx}
        <div class="flex gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-200 animate-in slide-in-from-left-1">
          <input 
            type="text" 
            placeholder="CID-10" 
            bind:value={it.cid} 
            oninput={onchange} 
            disabled={readonly} 
            class="w-20 font-mono uppercase border-slate-300 rounded-lg text-xs p-2 text-center tracking-widest font-black focus:border-purple-500 focus:ring-1 focus:ring-purple-200 outline-none bg-white"
          />
          <input 
            type="text" 
            placeholder="Descreva o diagnóstico e especificações clínicas..." 
            bind:value={it.descricao} 
            oninput={onchange} 
            disabled={readonly} 
            class="flex-1 border-slate-300 rounded-lg text-xs font-semibold p-2 placeholder:font-normal placeholder:text-slate-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 outline-none bg-white"
          />
          <select 
            bind:value={it.status} 
            onchange={onchange} 
            disabled={readonly} 
            class="text-xs font-bold border-slate-300 rounded-lg bg-white p-2 focus:border-purple-500 cursor-pointer"
          >
            <option value="Suspeito">Suspeito</option>
            <option value="Confirmado">Confirmado</option>
            <option value="Crônico">Crônico</option>
            <option value="Resolvido">Resolvido</option>
          </select>
          
          {#if !readonly}
            <button 
              type="button" 
              onclick={() => { hd.itens.splice(idx, 1); onchange?.(); }} 
              class="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 class="w-4 h-4"/>
            </button>
          {/if}
        </div>
      {/each}
      
      {#if hd.itens.length === 0}
        <div class="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs flex flex-col items-center bg-slate-50/20">
          <span class="font-medium">Nenhum diagnóstico listado na avaliação atual.</span>
          {#if !readonly}
            <button type="button" onclick={add} class="mt-2.5 text-purple-700 font-extrabold underline hover:text-purple-800 transition-colors">Adicionar Diagnóstico Agora</button>
          {/if}
        </div>
      {/if}
    </div>
  </div>

</div>
